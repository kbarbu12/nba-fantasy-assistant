SCORING_WEIGHTS = {
    "pts": 1.0,
    "reb": 1.2,
    "ast": 1.5,
    "stl": 4.0,
    "blk": 4.0,
    "fg3m": 1.0,
    "turnover": -1.0,
}

TIERS = [
    {"name": "Elite", "min_fpts": 50.0},
    {"name": "Star", "min_fpts": 42.0},
    {"name": "Solid", "min_fpts": 35.0},
    {"name": "Streamer", "min_fpts": 0.0},
]


def calculate_fantasy_points(stats: dict) -> float:
    return round(
        stats.get("pts", 0) * SCORING_WEIGHTS["pts"]
        + stats.get("reb", 0) * SCORING_WEIGHTS["reb"]
        + stats.get("ast", 0) * SCORING_WEIGHTS["ast"]
        + stats.get("stl", 0) * SCORING_WEIGHTS["stl"]
        + stats.get("blk", 0) * SCORING_WEIGHTS["blk"]
        + stats.get("fg3m", 0) * SCORING_WEIGHTS["fg3m"]
        + stats.get("turnover", 0) * SCORING_WEIGHTS["turnover"],
        1,
    )


def assign_tier(fpts: float) -> str:
    for tier in TIERS:
        if fpts >= tier["min_fpts"]:
            return tier["name"]
    return "Streamer"
