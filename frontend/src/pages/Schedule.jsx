import { useState, useEffect } from 'react';
import { getWeeklySchedule } from '../services/api';
import Loading from '../components/Loading';

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklySchedule()
      .then(res => { setSchedule(res.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loading message="Loading schedule..." />;

  const maxGames = Math.max(...schedule.map(t => t.games_this_week), 1);

  return (
    <div className="main">
      <div className="card">
        <div className="card-title">Weekly schedule — games per team</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
          Teams with more games = better streaming targets. Pick up players from 4+ game teams.
        </div>
        <table className="player-table">
          <thead>
            <tr><th>Team</th><th>Games</th><th></th><th>Matchups</th></tr>
          </thead>
          <tbody>
            {schedule.map(team => (
              <tr key={team.team_id}>
                <td>
                  <span className="player-name">{team.abbreviation}</span>
                  <span className="team-badge">{team.full_name}</span>
                </td>
                <td>
                  <span className={`sched-games ${team.games_this_week <= 2 ? 'low' : ''}`} style={{ fontWeight: 600, fontSize: 16 }}>
                    {team.games_this_week}
                  </span>
                </td>
                <td style={{ width: '30%' }}>
                  <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 4,
                      width: `${(team.games_this_week / maxGames) * 100}%`,
                      background: team.games_this_week >= 4 ? 'var(--accent2)' : team.games_this_week >= 3 ? 'var(--accent3)' : 'var(--red)',
                    }}></div>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {team.matchups?.map((m, i) => (
                    <span key={i}>
                      {m.home ? 'vs' : '@'} {m.opponent}
                      {i < team.matchups.length - 1 ? ', ' : ''}
                    </span>
                  )) || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tip" style={{ marginTop: 16 }}>
        💡 <b>Streaming strategy:</b> In a 10-team points league, streaming spots are key. Target players from teams with 4-5 games and drop them for the next heavy-schedule team.
      </div>
    </div>
  );
}
