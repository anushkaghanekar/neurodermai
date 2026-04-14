"""SQLite database setup for user accounts and scan history."""
from __future__ import annotations

import aiosqlite
from pathlib import Path

from app.config import get_settings

_db_connection: aiosqlite.Connection | None = None

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_filename TEXT,
    predicted_class TEXT NOT NULL,
    confidence REAL NOT NULL,
    top_3_json TEXT,
    explanation TEXT,
    disclaimer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"""


async def init_db() -> None:
    """Initialize the database connection and create tables."""
    global _db_connection
    settings = get_settings()

    # Ensure the directory exists
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    settings.scan_uploads_dir.mkdir(parents=True, exist_ok=True)

    _db_connection = await aiosqlite.connect(str(settings.db_path))
    _db_connection.row_factory = aiosqlite.Row
    await _db_connection.executescript(SCHEMA_SQL)
    await _db_connection.commit()


async def get_db() -> aiosqlite.Connection:
    """Return the active database connection."""
    if _db_connection is None:
        await init_db()
    return _db_connection


async def close_db() -> None:
    """Close the database connection."""
    global _db_connection
    if _db_connection is not None:
        await _db_connection.close()
        _db_connection = None
