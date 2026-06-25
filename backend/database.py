import aiosqlite
import json
from datetime import datetime, timedelta

DB_PATH = "fantasy_cache.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY,
                first_name TEXT,
                last_name TEXT,
                position TEXT,
                team_id INTEGER,
                team_abbreviation TEXT,
                team_name TEXT,
                stats_json TEXT,
                fantasy_points REAL DEFAULT 0,
                tier TEXT DEFAULT '',
                updated_at TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS news_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                headline TEXT,
                player TEXT,
                time TEXT,
                source TEXT,
                type TEXT,
                fetched_at TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS draft_status (
                player_id INTEGER PRIMARY KEY,
                drafted INTEGER DEFAULT 0
            )
        """)
        await db.commit()


async def upsert_player(player: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO players
               (id, first_name, last_name, position, team_id, team_abbreviation, team_name, stats_json, fantasy_points, tier, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                player["id"],
                player["first_name"],
                player["last_name"],
                player["position"],
                player.get("team_id", 0),
                player.get("team_abbreviation", ""),
                player.get("team_name", ""),
                json.dumps(player.get("stats", {})),
                player.get("fantasy_points", 0),
                player.get("tier", ""),
                datetime.now().isoformat(),
            ),
        )
        await db.commit()


async def get_cached_players(min_fpts: float = 0) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM players WHERE fantasy_points >= ? ORDER BY fantasy_points DESC",
            (min_fpts,),
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": r["id"],
                "first_name": r["first_name"],
                "last_name": r["last_name"],
                "position": r["position"],
                "team_id": r["team_id"],
                "team_abbreviation": r["team_abbreviation"],
                "team_name": r["team_name"],
                "stats": json.loads(r["stats_json"]) if r["stats_json"] else {},
                "fantasy_points": r["fantasy_points"],
                "tier": r["tier"],
            }
            for r in rows
        ]


async def is_cache_fresh(max_age_hours: int = 6) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT MAX(updated_at) FROM players")
        row = await cursor.fetchone()
        if not row or not row[0]:
            return False
        last_update = datetime.fromisoformat(row[0])
        return datetime.now() - last_update < timedelta(hours=max_age_hours)


async def set_drafted(player_id: int, drafted: bool):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR REPLACE INTO draft_status (player_id, drafted) VALUES (?, ?)",
            (player_id, 1 if drafted else 0),
        )
        await db.commit()


async def get_drafted_ids() -> set[int]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT player_id FROM draft_status WHERE drafted = 1")
        rows = await cursor.fetchall()
        return {r[0] for r in rows}
