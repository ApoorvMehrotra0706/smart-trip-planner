import aiosqlite
import json
import uuid
import re
from datetime import datetime

DB_PATH = "trips.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                slug TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                places TEXT NOT NULL,
                days INTEGER NOT NULL,
                style TEXT NOT NULL,
                itinerary TEXT,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()


def make_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    short_id = uuid.uuid4().hex[:6]
    return f"{base}-{short_id}" if base else short_id


async def save_trip(name: str, places: list, days: int, style: str, itinerary: str) -> str:
    slug = make_slug(name or "trip")
    trip_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO trips (id, slug, name, places, days, style, itinerary, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (trip_id, slug, name, json.dumps(places), days, style, itinerary, now),
        )
        await db.commit()

    return slug


async def get_trip(slug: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM trips WHERE slug = ?", (slug,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "slug": row["slug"],
                "name": row["name"],
                "places": json.loads(row["places"]),
                "days": row["days"],
                "style": row["style"],
                "itinerary": row["itinerary"],
                "created_at": row["created_at"],
            }
