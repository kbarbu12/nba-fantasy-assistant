import { useState, useEffect } from 'react';
import { getWaivers } from '../services/api';
import Loading from '../components/Loading';

export default function Waivers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [position, setPosition] = useState('');

  useEffect(() => {
    setLoading(true);
    getWaivers({ period, position: position || undefined, limit: 30 })
      .then(res => { setPlayers(res.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, position]);

  if (loading) return <Loading message="Finding waiver pickups..." />;

  return (
    <div className="main">
      <div className="toolbar">
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
        <select value={position} onChange={e => setPosition(e.target.value)}>
          <option value="">All positions</option>
          <option value="PG">PG</option>
          <option value="SG">SG</option>
          <option value="SF">SF</option>
          <option value="PF">PF</option>
          <option value="C">C</option>
        </select>
      </div>

      <div className="card">
        <div className="card-title">Waiver wire — top available players (based on recent performance)</div>
        <table className="player-table">
          <thead>
            <tr>
              <th>#</th><th>Player</th><th>Pos</th><th>Team</th>
              <th>FPTS/G</th><th>PTS</th><th>REB</th><th>AST</th>
              <th>STL</th><th>BLK</th><th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>{p.waiver_rank}</td>
                <td><span className="player-name">{p.name}</span></td>
                <td><span className="pc-pos">{p.position}</span></td>
                <td><span className="team-badge">{p.team_abbreviation}</span></td>
                <td className="fpts">{p.fantasy_points}</td>
                <td>{p.stats?.pts}</td>
                <td>{p.stats?.reb}</td>
                <td>{p.stats?.ast}</td>
                <td>{p.stats?.stl}</td>
                <td>{p.stats?.blk}</td>
                <td>
                  <span className={`trend-${p.trend}`}>
                    {p.trend === 'up' ? '▲ Up' : p.trend === 'down' ? '▼ Down' : '— Stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tip" style={{ marginTop: 16 }}>
        💡 <b>Waiver tip:</b> In a 10-team league, look for players averaging 30+ FPTS/G who might be unrostered. Check the Schedule page for teams with heavy weeks.
      </div>
    </div>
  );
}
