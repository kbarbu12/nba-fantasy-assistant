from datetime import datetime, timedelta

NBA_TEAMS = {
    1: {"abbreviation": "ATL", "full_name": "Atlanta Hawks"},
    2: {"abbreviation": "BOS", "full_name": "Boston Celtics"},
    3: {"abbreviation": "BKN", "full_name": "Brooklyn Nets"},
    4: {"abbreviation": "CHA", "full_name": "Charlotte Hornets"},
    5: {"abbreviation": "CHI", "full_name": "Chicago Bulls"},
    6: {"abbreviation": "CLE", "full_name": "Cleveland Cavaliers"},
    7: {"abbreviation": "DAL", "full_name": "Dallas Mavericks"},
    8: {"abbreviation": "DEN", "full_name": "Denver Nuggets"},
    9: {"abbreviation": "DET", "full_name": "Detroit Pistons"},
    10: {"abbreviation": "GSW", "full_name": "Golden State Warriors"},
    11: {"abbreviation": "HOU", "full_name": "Houston Rockets"},
    12: {"abbreviation": "IND", "full_name": "Indiana Pacers"},
    13: {"abbreviation": "LAC", "full_name": "LA Clippers"},
    14: {"abbreviation": "LAL", "full_name": "Los Angeles Lakers"},
    15: {"abbreviation": "MEM", "full_name": "Memphis Grizzlies"},
    16: {"abbreviation": "MIA", "full_name": "Miami Heat"},
    17: {"abbreviation": "MIL", "full_name": "Milwaukee Bucks"},
    18: {"abbreviation": "MIN", "full_name": "Minnesota Timberwolves"},
    19: {"abbreviation": "NOP", "full_name": "New Orleans Pelicans"},
    20: {"abbreviation": "NYK", "full_name": "New York Knicks"},
    21: {"abbreviation": "OKC", "full_name": "Oklahoma City Thunder"},
    22: {"abbreviation": "ORL", "full_name": "Orlando Magic"},
    23: {"abbreviation": "PHI", "full_name": "Philadelphia 76ers"},
    24: {"abbreviation": "PHX", "full_name": "Phoenix Suns"},
    25: {"abbreviation": "POR", "full_name": "Portland Trail Blazers"},
    26: {"abbreviation": "SAC", "full_name": "Sacramento Kings"},
    27: {"abbreviation": "SAS", "full_name": "San Antonio Spurs"},
    28: {"abbreviation": "TOR", "full_name": "Toronto Raptors"},
    29: {"abbreviation": "UTA", "full_name": "Utah Jazz"},
    30: {"abbreviation": "WAS", "full_name": "Washington Wizards"},
}


def get_team_abbr(team_id: int) -> str:
    return NBA_TEAMS.get(team_id, {}).get("abbreviation", "???")


def get_team_name(team_id: int) -> str:
    return NBA_TEAMS.get(team_id, {}).get("full_name", "Unknown")


def get_week_dates(reference_date: datetime = None) -> list[str]:
    if reference_date is None:
        reference_date = datetime.now()
    monday = reference_date - timedelta(days=reference_date.weekday())
    return [(monday + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]


async def get_weekly_schedule(nba_client, season: int = 2024) -> list[dict]:
    dates = get_week_dates()
    games = await nba_client.get_games(dates=dates, season=season)

    team_games: dict[int, int] = {}
    team_matchups: dict[int, list] = {}

    for game in games:
        home_id = game["home_team"]["id"]
        away_id = game["visitor_team"]["id"]
        game_date = game["date"][:10]

        for tid in [home_id, away_id]:
            team_games[tid] = team_games.get(tid, 0) + 1
            team_matchups.setdefault(tid, []).append({
                "date": game_date,
                "opponent": get_team_abbr(away_id if tid == home_id else home_id),
                "home": tid == home_id,
            })

    schedule = []
    for team_id, info in NBA_TEAMS.items():
        schedule.append({
            "team_id": team_id,
            "abbreviation": info["abbreviation"],
            "full_name": info["full_name"],
            "games_this_week": team_games.get(team_id, 0),
            "matchups": team_matchups.get(team_id, []),
        })

    schedule.sort(key=lambda x: x["games_this_week"], reverse=True)
    return schedule
