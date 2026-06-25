import httpx
from bs4 import BeautifulSoup
from datetime import datetime


async def scrape_rotowire_news() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://www.rotowire.com/basketball/news.php",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        news_items = []
        for item in soup.select(".news-update")[:20]:
            headline = item.select_one(".news-update__headline")
            player = item.select_one(".news-update__player-link")
            timestamp = item.select_one(".news-update__timestamp")
            if headline:
                news_items.append({
                    "headline": headline.get_text(strip=True),
                    "player": player.get_text(strip=True) if player else "",
                    "time": timestamp.get_text(strip=True) if timestamp else "",
                    "source": "Rotowire",
                    "type": classify_news(headline.get_text(strip=True)),
                })
        return news_items
    except Exception:
        return []


async def scrape_basketball_monster() -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://basketballmonster.com/news.aspx",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        news_items = []
        for item in soup.select(".newsitem, .news-row, tr")[:20]:
            text = item.get_text(strip=True)
            if len(text) > 10:
                news_items.append({
                    "headline": text[:200],
                    "player": "",
                    "time": "",
                    "source": "Basketball Monster",
                    "type": classify_news(text),
                })
        return news_items[:15]
    except Exception:
        return []


def classify_news(text: str) -> str:
    text_lower = text.lower()
    injury_keywords = ["out", "injury", "injured", "questionable", "doubtful", "gtd", "day-to-day", "ruled out", "knee", "ankle", "hamstring", "concussion", "rest"]
    if any(kw in text_lower for kw in injury_keywords):
        return "injury"
    trade_keywords = ["trade", "traded", "waived", "signed", "released", "acquired"]
    if any(kw in text_lower for kw in trade_keywords):
        return "transaction"
    return "update"


async def get_all_news() -> list[dict]:
    from asyncio import gather
    rotowire, bmonster = await gather(
        scrape_rotowire_news(),
        scrape_basketball_monster(),
    )
    all_news = rotowire + bmonster
    all_news.sort(key=lambda x: x.get("time", ""), reverse=True)
    return all_news
