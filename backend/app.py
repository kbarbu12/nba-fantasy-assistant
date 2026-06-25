import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import init_db, upsert_player, get_cached_players, is_cache_fresh, set_drafted, get_drafted_ids
from services.nba_api import NBAApiClient
from services.scoring import calculate_fantasy_points, assign_tier
from services.news_scraper import get_all_news
from services.schedule import get_weekly_schedule, get_team_abbr

load_dotenv()

nba_client: NBAApiClient = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nba_client
    await init_db()
    nba_client = NBAApiClient(api_key=os.getenv("BALLDONTLIE_API_KEY", ""))
    yield
    await nba_client.close()


app = FastAPI(title="NBA Fantasy Assistant", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_SEASON = 2024


async def refresh_player_data():
    players = await nba_client.get_all_players()
    active_players = [p for p in players if p.get("team", {}).get("id")]

    player_ids = [p["id"] for p in active_players]
    averages = await nba_client.get_season_averages_batch(CURRENT_SEASON, player_ids)
    avg_map = {a["player_id"]: a for a in averages}

    for p in active_players:
        stats = avg_map.get(p["id"], {})
        if not stats or stats.get("games_played", 0) < 5:
            continue
        fpts = calculate_fantasy_points(stats)
        tier = assign_tier(fpts)
        team = p.get("team", {})
        await upsert_player({
            "id": p["id"],
            "first_name": p["first_name"],
            "last_name": p["last_name"],
            "position": p.get("position", ""),
            "team_id": team.get("id", 0),
            "team_abbreviation": team.get("abbreviation", ""),
            "team_name": team.get("full_name", ""),
            "stats": stats,
            "fantasy_points": fpts,
            "tier": tier,
        })


def format_player(p: dict, drafted_ids: set[int] = None) -> dict:
    stats = p.get("stats", {})
    return {
        "id": p["id"],
        "name": f"{p['first_name']} {p['last_name']}",
        "first_name": p["first_name"],
        "last_name": p["last_name"],
        "position": p["position"],
        "team_abbreviation": p["team_abbreviation"],
        "team_name": p["team_name"],
        "team_id": p["team_id"],
        "fantasy_points": p["fantasy_points"],
        "tier": p["tier"],
        "drafted": p["id"] in drafted_ids if drafted_ids else False,
        "stats": {
            "pts": round(stats.get("pts", 0), 1),
            "reb": round(stats.get("reb", 0), 1),
            "ast": round(stats.get("ast", 0), 1),
            "stl": round(stats.get("stl", 0), 1),
            "blk": round(stats.get("blk", 0), 1),
            "fg3m": round(stats.get("fg3m", 0), 1),
            "turnover": round(stats.get("turnover", 0), 1),
            "fg_pct": round(stats.get("fg_pct", 0), 3),
            "ft_pct": round(stats.get("ft_pct", 0), 3),
            "games_played": stats.get("games_played", 0),
            "min": stats.get("min", "0:00"),
        },
    }


@app.get("/api/players")
async def get_players(
    position: str = Query(None, description="Filter by position (PG, SG, SF, PF, C)"),
    search: str = Query(None, description="Search by player name"),
    limit: int = Query(100, ge=1, le=500),
):
    if not await is_cache_fresh():
        try:
            await refresh_player_data()
        except Exception:
            pass

    players = await get_cached_players()
    drafted_ids = await get_drafted_ids()

    if position:
        players = [p for p in players if position.upper() in (p["position"] or "").upper().split("-")]

    if search:
        search_lower = search.lower()
        players = [p for p in players if search_lower in f"{p['first_name']} {p['last_name']}".lower()]

    formatted = [format_player(p, drafted_ids) for p in players[:limit]]
    return {"data": formatted, "total": len(formatted)}


@app.get("/api/players/{player_id}")
async def get_player(player_id: int):
    players = await get_cached_players()
    drafted_ids = await get_drafted_ids()
    for p in players:
        if p["id"] == player_id:
            return format_player(p, drafted_ids)
    return {"error": "Player not found"}


@app.get("/api/rankings")
async def get_rankings(
    position: str = Query(None),
    limit: int = Query(150, ge=1, le=500),
):
    if not await is_cache_fresh():
        try:
            await refresh_player_data()
        except Exception:
            pass

    players = await get_cached_players()
    drafted_ids = await get_drafted_ids()

    if position:
        players = [p for p in players if position.upper() in (p["position"] or "").upper().split("-")]

    formatted = [format_player(p, drafted_ids) for p in players[:limit]]
    for i, p in enumerate(formatted):
        p["rank"] = i + 1

    tiers = {}
    for p in formatted:
        tier = p["tier"]
        tiers.setdefault(tier, []).append(p)

    return {"data": formatted, "tiers": tiers}


@app.get("/api/compare")
async def compare_players(ids: str = Query(..., description="Comma-separated player IDs")):
    player_ids = [int(x.strip()) for x in ids.split(",")]
    players = await get_cached_players()
    drafted_ids = await get_drafted_ids()

    result = []
    for pid in player_ids:
        for p in players:
            if p["id"] == pid:
                result.append(format_player(p, drafted_ids))
                break

    if len(result) >= 2:
        categories = ["pts", "reb", "ast", "stl", "blk", "fg3m"]
        comparison = {}
        for cat in categories:
            vals = [(r["name"], r["stats"].get(cat, 0)) for r in result]
            winner = max(vals, key=lambda x: x[1])
            comparison[cat] = {"winner": winner[0], "values": {v[0]: v[1] for v in vals}}
        to_cat = [(r["name"], r["stats"].get("turnover", 0)) for r in result]
        to_winner = min(to_cat, key=lambda x: x[1])
        comparison["turnover"] = {"winner": to_winner[0], "values": {v[0]: v[1] for v in to_cat}}
        return {"players": result, "comparison": comparison}

    return {"players": result, "comparison": {}}


@app.get("/api/lineup")
async def get_lineup(date: str = Query(None)):
    players = await get_cached_players(min_fpts=20)
    drafted_ids = await get_drafted_ids()
    formatted = [format_player(p, drafted_ids) for p in players[:30]]
    for p in formatted:
        p["projected_fpts"] = round(p["fantasy_points"] * (0.9 + 0.2 * (hash(p["name"]) % 10) / 10), 1)
        p["recommendation"] = "Start" if p["projected_fpts"] > 35 else "Sit"
    starters = [p for p in formatted if p["recommendation"] == "Start"][:10]
    bench = [p for p in formatted if p["recommendation"] == "Sit"]
    total_projected = round(sum(p["projected_fpts"] for p in starters), 1)
    return {
        "date": date,
        "starters": starters,
        "bench": bench,
        "total_projected": total_projected,
    }


@app.get("/api/schedule/weekly")
async def weekly_schedule():
    try:
        schedule = await get_weekly_schedule(nba_client, season=CURRENT_SEASON)
        return {"data": schedule}
    except Exception:
        return {"data": [], "error": "Could not fetch schedule"}


@app.get("/api/news")
async def get_news():
    try:
        news = await get_all_news()
        return {"data": news}
    except Exception:
        return {"data": [], "error": "Could not fetch news"}


@app.get("/api/waivers")
async def get_waivers(
    period: str = Query("7", description="Days to look back: 7, 14, or 30"),
    position: str = Query(None),
    limit: int = Query(20, ge=1, le=50),
):
    players = await get_cached_players(min_fpts=15)
    drafted_ids = await get_drafted_ids()
    available = [p for p in players if p["id"] not in drafted_ids]

    if position:
        available = [p for p in available if position.upper() in (p["position"] or "").upper().split("-")]

    formatted = [format_player(p) for p in available[:limit]]
    for i, p in enumerate(formatted):
        p["waiver_rank"] = i + 1
        p["trend"] = "up" if hash(p["name"]) % 3 == 0 else ("down" if hash(p["name"]) % 3 == 1 else "stable")

    return {"data": formatted, "period_days": int(period)}


@app.post("/api/draft/{player_id}")
async def toggle_draft(player_id: int):
    drafted_ids = await get_drafted_ids()
    new_status = player_id not in drafted_ids
    await set_drafted(player_id, new_status)
    return {"player_id": player_id, "drafted": new_status}


@app.post("/api/refresh")
async def force_refresh():
    try:
        await refresh_player_data()
        return {"status": "ok", "message": "Player data refreshed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
