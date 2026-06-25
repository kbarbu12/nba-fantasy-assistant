import httpx
from typing import Optional

BASE_URL = "https://api.balldontlie.io/v1"


class NBAApiClient:
    def __init__(self, api_key: str = ""):
        headers = {}
        if api_key:
            headers["Authorization"] = api_key
        self.client = httpx.AsyncClient(
            base_url=BASE_URL, headers=headers, timeout=30.0
        )

    async def get_players(self, cursor: Optional[int] = None, per_page: int = 100, search: str = "") -> dict:
        params = {"per_page": per_page}
        if cursor:
            params["cursor"] = cursor
        if search:
            params["search"] = search
        resp = await self.client.get("/players", params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_all_players(self) -> list[dict]:
        all_players = []
        cursor = None
        while True:
            data = await self.get_players(cursor=cursor, per_page=100)
            all_players.extend(data["data"])
            next_cursor = data.get("meta", {}).get("next_cursor")
            if not next_cursor:
                break
            cursor = next_cursor
        return all_players

    async def get_season_averages(self, season: int, player_ids: list[int]) -> list[dict]:
        if not player_ids:
            return []
        params = {"season": season}
        for pid in player_ids:
            params.setdefault("player_ids[]", [])
        resp = await self.client.get(
            "/season_averages",
            params={"season": season, **{f"player_ids[]": player_ids}},
        )
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_season_averages_batch(self, season: int, player_ids: list[int], batch_size: int = 25) -> list[dict]:
        all_averages = []
        for i in range(0, len(player_ids), batch_size):
            batch = player_ids[i : i + batch_size]
            params = {"season": season}
            for pid in batch:
                params[f"player_ids[]"] = batch
            resp = await self.client.get("/season_averages", params=params)
            resp.raise_for_status()
            all_averages.extend(resp.json().get("data", []))
        return all_averages

    async def get_games(self, dates: list[str] = None, team_ids: list[int] = None, season: int = None) -> list[dict]:
        params = {"per_page": 100}
        if season:
            params["seasons[]"] = [season]
        if dates:
            for d in dates:
                params.setdefault("dates[]", []).append(d)
            params["dates[]"] = dates
        if team_ids:
            params["team_ids[]"] = team_ids
        resp = await self.client.get("/games", params=params)
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def get_stats(self, player_ids: list[int] = None, game_ids: list[int] = None, dates: list[str] = None, per_page: int = 100) -> list[dict]:
        params = {"per_page": per_page}
        if player_ids:
            params["player_ids[]"] = player_ids
        if game_ids:
            params["game_ids[]"] = game_ids
        if dates:
            params["dates[]"] = dates
        resp = await self.client.get("/stats", params=params)
        resp.raise_for_status()
        return resp.json().get("data", [])

    async def close(self):
        await self.client.aclose()
