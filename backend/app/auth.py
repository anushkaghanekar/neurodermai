"""Authentication: registration, login, and JWT token management."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.database import get_db


_bearer_scheme = HTTPBearer(auto_error=False)

# Simple email regex — good enough for validation
_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(user_id: int, email: str, settings: Settings) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiry_hours),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_token(token: str, settings: Settings) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )


async def register_user(email: str, password: str, name: str) -> dict[str, Any]:
    """Register a new user and return a JWT token."""
    email = email.strip().lower()
    name = name.strip()

    if not _EMAIL_RE.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required.",
        )

    db = await get_db()

    # Check if user already exists
    cursor = await db.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = await cursor.fetchone()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    password_hash = _hash_password(password)
    cursor = await db.execute(
        "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
        (email, name, password_hash),
    )
    await db.commit()
    user_id = cursor.lastrowid

    settings = get_settings()
    token = _create_token(user_id, email, settings)

    return {
        "token": token,
        "user": {"id": user_id, "email": email, "name": name},
    }


async def login_user(email: str, password: str) -> dict[str, Any]:
    """Authenticate a user and return a JWT token."""
    email = email.strip().lower()

    db = await get_db()
    cursor = await db.execute(
        "SELECT id, email, name, password_hash FROM users WHERE email = ?", (email,)
    )
    user = await cursor.fetchone()

    if not user or not _verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    settings = get_settings()
    token = _create_token(user["id"], user["email"], settings)

    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"]},
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any] | None:
    """FastAPI dependency — returns user dict if authenticated, None otherwise.

    This is non-strict: unauthenticated requests still proceed (for the predict
    endpoint which works with or without auth).
    """
    if credentials is None:
        return None

    settings = get_settings()
    payload = _decode_token(credentials.credentials, settings)
    user_id = payload.get("user_id")

    if user_id is None:
        return None

    db = await get_db()
    cursor = await db.execute(
        "SELECT id, email, name FROM users WHERE id = ?", (user_id,)
    )
    user = await cursor.fetchone()
    if not user:
        return None

    return {"id": user["id"], "email": user["email"], "name": user["name"]}


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """FastAPI dependency — strictly requires authentication."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    settings = get_settings()
    payload = _decode_token(credentials.credentials, settings)
    user_id = payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    db = await get_db()
    cursor = await db.execute(
        "SELECT id, email, name FROM users WHERE id = ?", (user_id,)
    )
    user = await cursor.fetchone()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    return {"id": user["id"], "email": user["email"], "name": user["name"]}
