import { useState, useEffect } from 'react';
import { getPlayers, comparePlayers } from '../services/api';
import Loading from '../components/Loading';

export default function Compare() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayers({ limit: 100 })
      .then(res => { setAllPlayers(res.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCompare = async () => {
    if (!player1Id || !player2Id) return;
    setLoading(true);
    try {
      const res = await comparePlayers([Number(player1Id), Number(player2Id)]);
      setResult(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading && !allPlayers.length) return <Loading message="Loading players..." />;

  const p1 = result?.players?.[0];
  const p2 = result?.players?.[1];
  const comp = result?.comparison || {};

  const statCategories = [
    { key: 'pts', label: 'PTS' },
    { key: 'reb', label: 'REB' },
    { key: 'ast', label: 'AST' },
    { key: 'stl', label: 'STL' },
    { key: 'blk', label: 'BLK' },
    { key: 'fg3m', label: '3PM' },
    { key: 'turnover', label: 'TO' },
  ];

  const getBarWidth = (val, maxVal) => maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;

  return (
    <div className="main">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Select two players to compare</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
          <select className="compare-select" value={player1Id} onChange={e => setPlayer1Id(e.target.value)}>
            <option value="">Select player 1</option>
            {allPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.team_abbreviation}) — {p.fantasy_points} FPTS</option>
            ))}
          </select>
          <div className="vs">VS</div>
          <select className="compare-select" value={player2Id} onChange={e => setPlayer2Id(e.target.value)}>
            <option value="">Select player 2</option>
            {allPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.team_abbreviation}) — {p.fantasy_points} FPTS</option>
            ))}
          </select>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="compare-btn" onClick={handleCompare} disabled={!player1Id || !player2Id || loading}>
            {loading ? 'Comparing...' : 'Compare players'}
          </button>
        </div>
      </div>

      {p1 && p2 && (
        <>
          <div className="compare-header">
            <div className="player-pick left">
              <div className="pp-name">{p1.name}</div>
              <div className="pp-info">{p1.team_abbreviation} · {p1.position}</div>
              <div className="pp-fpts orange">{p1.fantasy_points}<span>FPTS/G</span></div>
            </div>
            <div className="vs">VS</div>
            <div className="player-pick right">
              <div className="pp-name">{p2.name}</div>
              <div className="pp-info">{p2.team_abbreviation} · {p2.position}</div>
              <div className="pp-fpts blue">{p2.fantasy_points}<span>FPTS/G</span></div>
            </div>
          </div>

          <div className="card stat-bars">
            {statCategories.map(({ key, label }) => {
              const v1 = p1.stats?.[key] || 0;
              const v2 = p2.stats?.[key] || 0;
              const maxVal = Math.max(v1, v2, 1);
              const isTO = key === 'turnover';
              const w1 = isTO ? (v1 === 0 ? 0 : getBarWidth(v1, maxVal)) : getBarWidth(v1, maxVal);
              const w2 = isTO ? (v2 === 0 ? 0 : getBarWidth(v2, maxVal)) : getBarWidth(v2, maxVal);
              const winner = comp[key]?.winner;
              return (
                <div className="stat-row" key={key}>
                  <div className="stat-label-left">{label}</div>
                  <div className="bar-wrap left"><div className="bar orange" style={{ width: `${w1}%` }}></div></div>
                  <div className={`stat-val ${winner === p1.name ? 'winner' : ''}`}>{v1}</div>
                  <div style={{ textAlign: 'center', color: 'var(--border)' }}>·</div>
                  <div className={`stat-val ${winner === p2.name ? 'winner' : ''}`}>{v2}</div>
                  <div className="bar-wrap"><div className="bar blue" style={{ width: `${w2}%` }}></div></div>
                  <div className="stat-label-right">{label}</div>
                </div>
              );
            })}
          </div>

          <div className="verdict">
            <div className="verdict-item">
              <div className="verdict-label">Fantasy points edge</div>
              <div className={`verdict-val ${p1.fantasy_points >= p2.fantasy_points ? 'orange' : 'blue'}`}>
                {p1.fantasy_points >= p2.fantasy_points ? p1.name.split(' ').pop() : p2.name.split(' ').pop()}{' '}
                +{Math.abs(p1.fantasy_points - p2.fantasy_points).toFixed(1)}
              </div>
            </div>
            <div className="verdict-item">
              <div className="verdict-label">Games played</div>
              <div className="verdict-val green">
                {p1.stats?.games_played || '?'} vs {p2.stats?.games_played || '?'}
              </div>
            </div>
            <div className="verdict-item">
              <div className="verdict-label">Recommendation</div>
              <div className={`verdict-val ${p1.fantasy_points >= p2.fantasy_points ? 'orange' : 'blue'}`}>
                {p1.fantasy_points >= p2.fantasy_points ? p1.name.split(' ').pop() : p2.name.split(' ').pop()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
