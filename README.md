# NBA Fantasy Assistant

A web app for ESPN Fantasy NBA Points League (10 teams). Helps with draft rankings, daily lineups, waiver wire pickups, player comparisons, and schedule analysis.

## Scoring Settings
| Category | Weight |
|----------|--------|
| PTS | ×1.0 |
| REB | ×1.2 |
| AST | ×1.5 |
| STL | ×4.0 |
| BLK | ×4.0 |
| 3PM | ×1.0 |
| TO | ×-1.0 |

## Setup

### Backend (Python FastAPI)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your balldontlie API key
uvicorn app:app --reload
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The backend runs on `http://localhost:8000` and the frontend on `http://localhost:5173`.

## Features
- **Draft Board** — Tiered player rankings with search/filter, click to mark as drafted
- **Lineup Optimizer** — Daily start/sit recommendations with projected fantasy points
- **Waiver Wire** — Top available players ranked by recent performance (7/14/30 day windows)
- **Player Comparison** — Side-by-side stat breakdown with visual bars and verdict
- **Schedule Analysis** — Weekly games per team for streaming strategy
- **News Feed** — Injury and transaction updates from Rotowire and Basketball Monster

## Data Sources
- [balldontlie API](https://www.balldontlie.io/) — NBA player stats and season averages
- Rotowire — Injury and player news
- Basketball Monster — Fantasy analysis and updates
