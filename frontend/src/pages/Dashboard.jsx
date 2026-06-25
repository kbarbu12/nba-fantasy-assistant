import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRankings, getNews, getWeeklySchedule } from '../services/api';
import Loading from '../components/Loading';

export default function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [news, setNews] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRankings({ limit: 10 }).catch(() => ({ data: { data: [] } })),
      getNews().catch(() => ({ data: { data: [] } })),
      getWeeklySchedule().catch(() => ({ data: { data: [] } })),
    ]).then(([rankRes, newsRes, schedRes]) => {
      setPlayers(rankRes.data?.data || []);
      setNews(newsRes.data?.data || []);
      setSchedule((schedRes.data?.data || []).slice(0, 6));
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading message="Loading dashboard..." />;

  const topAvailable = players.find(p => !p.drafted);
  const trendingUp = players[5];
  const trendingDown = players[players.length - 1];

  return (
    <div className="main">
      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Top available</div>
          <div className="stat-value">{topAvailable?.name?.split(' ').pop() || '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Trending up</div>
          <div className="stat-value up">▲ {trendingUp?.name?.split(' ').pop() || '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Trending down</div>
          <div className="stat-value down">▼ {trendingDown?.name?.split(' ').pop() || '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Players loaded</div>
          <div className="stat-value">{players.length}</div>
        </div>
      </div>

      <div className="layout-sidebar">
        <div>
          <div className="card">
            <div className="card-title">Top fantasy rankings — points league</div>
            <table className="player-table">
              <thead>
                <tr>
                  <th>Rank</th><th>Player</th><th>Pos</th><th>Tier</th>
                  <th>FPTS/G</th><th>PTS</th><th>REB</th><th>AST</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`rank-badge ${i < 3 ? `rank-${i + 1}` : 'rank-n'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <span className="player-name">{p.name}</span>
                      <span className="team-badge">{p.team_abbreviation}</span>
                    </td>
                    <td><span className="pc-pos">{p.position}</span></td>
                    <td><span className={`tier tier-${p.tier}`}>{p.tier}</span></td>
                    <td className="fpts">{p.fantasy_points}</td>
                    <td>{p.stats?.pts}</td>
                    <td>{p.stats?.reb}</td>
                    <td>{p.stats?.ast}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Link to="/draft" className="filter-btn" style={{ display: 'inline-block' }}>
                View full draft board →
              </Link>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="card">
            <div className="card-title">Injury & news feed</div>
            {news.length === 0 && <div style={{ fontSize: 12, color: 'var(--text2)' }}>No news available</div>}
            {news.slice(0, 6).map((item, i) => (
              <div className="news-item" key={i}>
                <span className={`injury injury-${item.type === 'injury' ? 'out' : 'update'}`}>
                  {item.type === 'injury' ? 'INJ' : item.type === 'transaction' ? 'TXN' : 'UPD'}
                </span>{' '}
                <b>{item.player || ''}</b> {item.headline?.slice(0, 80)}
                <div className="news-time">{item.time} · {item.source}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Weekly schedule</div>
            {schedule.map((team, i) => (
              <div className="sched-team" key={i}>
                <span>{team.abbreviation} {team.full_name?.split(' ').pop()}</span>
                <span className={`sched-games ${team.games_this_week <= 2 ? 'low' : ''}`}>
                  {team.games_this_week} games
                </span>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link to="/schedule" className="filter-btn" style={{ display: 'inline-block', fontSize: 11 }}>
                Full schedule →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
