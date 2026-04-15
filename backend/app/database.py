"""PostgreSQL database setup for user accounts and scan history."""
from __future__ import annotations

import asyncpg
from typing import Any

from app.config import get_settings

_db_pool: asyncpg.Pool | None = None

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    predicted_class TEXT NOT NULL,
    confidence REAL NOT NULL,
    top_3_json JSONB,
    explanation TEXT,
    precautions JSONB,
    user_notes TEXT,
    disclaimer TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""


async def init_db() -> None:
    """Initialize the database pool and create tables."""
    global _db_pool
    settings = get_settings()

    # Create connection pool
    _db_pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=1,
        max_size=10
    )

    async with _db_pool.acquire() as conn:
        await conn.execute(SCHEMA_SQL)


async def get_db() -> asyncpg.Pool:
    """Return the active database pool."""
    if _db_pool is None:
        await init_db()
    return _db_pool


async def close_db() -> None:
    """Close the database pool."""
    global _db_pool
    if _db_pool is not None:
        await _db_pool.close()
        _db_pool = None
