import { useState, useEffect } from 'react';
import { getLineup } from '../services/api';
import Loading from '../components/Loading';

export default function Lineup() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    getLineup(date)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [date]);

  const changeDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric'
    });
  };

  if (loading) return <Loading message="Optimizing lineup..." />;

  const starters = data?.starters || [];
  const bench = data?.bench || [];
  const slots = ['PG', 'SG', 'SF', 'PF', 'C', 'UTIL', 'UTIL', 'UTIL'];

  return (
    <div className="main">
      <div className="date-nav">
        <button onClick={() => changeDate(-1)}>◀</button>
        <span className="current">📅 {formatDate(date)}</span>
        <button onClick={() => changeDate(1)}>▶</button>
      </div>

      <div className="layout-sidebar">
        <div>
          <div className="card">
            <div className="card-title">Optimized lineup</div>
            <table className="player-table">
              <thead>
                <tr><th>Slot</th><th>Player</th><th>Pos</th><th>Team</th><th>Proj FPTS</th><th>Action</th></tr>
              </thead>
              <tbody>
                {starters.map((p, i) => (
                  <tr key={p.id}>
                    <td><span className="slot">{slots[i] || 'UTIL'}</span></td>
                    <td><span className="player-name">{p.name}</span></td>
                    <td><span className="pc-pos">{p.position}</span></td>
                    <td><span className="team-badge">{p.team_abbreviation}</span></td>
                    <td className="fpts">{p.projected_fpts}</td>
                    <td><span className="action action-start">Start</span></td>
                  </tr>
                ))}
                {bench.length > 0 && (
                  <tr><td colSpan="6" className="section-label">Bench</td></tr>
                )}
                {bench.map(p => (
                  <tr key={p.id} style={{ opacity: 0.5 }}>
                    <td><span className="slot">BE</span></td>
                    <td><span className="player-name">{p.name}</span></td>
                    <td><span className="pc-pos">{p.position}</span></td>
                    <td><span className="team-badge">{p.team_abbreviation}</span></td>
                    <td style={{ color: 'var(--text2)' }}>{p.projected_fpts}</td>
                    <td><span className="action action-sit">Sit</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="total-bar">
              <span className="total-label">Projected total</span>
              <span className="total-val">{data?.total_projected || 0} FPTS</span>
            </div>
          </div>

          <div className="tip">
            💡 <b>Tip:</b> Check the Schedule page for teams with 4+ games this week for streaming opportunities.
          </div>
        </div>

        <div className="sidebar">
          <div className="card">
            <div className="card-title">Scoring weights</div>
            <div className="sched-team"><span>Points (PTS)</span><span>×1.0</span></div>
            <div className="sched-team"><span>Rebounds (REB)</span><span>×1.2</span></div>
            <div className="sched-team"><span>Assists (AST)</span><span>×1.5</span></div>
            <div className="sched-team"><span>Steals (STL)</span><span style={{ color: 'var(--accent)' }}>×4.0</span></div>
            <div className="sched-team"><span>Blocks (BLK)</span><span style={{ color: 'var(--accent)' }}>×4.0</span></div>
            <div className="sched-team"><span>3PM</span><span>×1.0</span></div>
            <div className="sched-team"><span>Turnovers (TO)</span><span style={{ color: 'var(--red)' }}>×-1.0</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
