import { useState, useEffect } from 'react';
import { getRankings, toggleDraft } from '../services/api';
import Loading from '../components/Loading';

export default function DraftBoard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [filter, setFilter] = useState('available');

  useEffect(() => {
    getRankings({ position: position || undefined, limit: 200 })
      .then(res => { setPlayers(res.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [position]);

  const handleDraft = async (id) => {
    await toggleDraft(id);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, drafted: !p.drafted } : p));
  };

  if (loading) return <Loading message="Loading draft board..." />;

  let filtered = players;
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (filter === 'available') filtered = filtered.filter(p => !p.drafted);
  if (filter === 'drafted') filtered = filtered.filter(p => p.drafted);

  const tiers = {};
  filtered.forEach(p => {
    if (!tiers[p.tier]) tiers[p.tier] = [];
    tiers[p.tier].push(p);
  });

  const tierOrder = ['Elite', 'Star', 'Solid', 'Streamer'];
  const tierDescriptions = {
    Elite: 'Picks 1–5 · Consistent top producers',
    Star: 'Picks 6–15 · High upside starters',
    Solid: 'Picks 16–40 · Reliable contributors',
    Streamer: 'Late rounds · Streaming candidates',
  };

  return (
    <div className="main">
      <div className="toolbar">
        <input
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={position} onChange={e => setPosition(e.target.value)}>
          <option value="">All positions</option>
          <option value="PG">PG</option>
          <option value="SG">SG</option>
          <option value="SF">SF</option>
          <option value="PF">PF</option>
          <option value="C">C</option>
        </select>
        <button className={`filter-btn ${filter === 'available' ? 'active' : ''}`} onClick={() => setFilter('available')}>Available</button>
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-btn ${filter === 'drafted' ? 'active' : ''}`} onClick={() => setFilter('drafted')}>Drafted</button>
      </div>

      {tierOrder.map(tierName => {
        const tierPlayers = tiers[tierName];
        if (!tierPlayers?.length) return null;
        return (
          <div className="tier-section" key={tierName}>
            <div className="tier-header">
              <span className={`tier-label tier-${tierName}`}>Tier — {tierName}</span>
              <span className="tier-count">{tierDescriptions[tierName]}</span>
            </div>
            <div className="players-grid">
              {tierPlayers.map((p, i) => (
                <div
                  className={`player-card ${p.drafted ? 'drafted' : ''}`}
                  key={p.id}
                  onClick={() => handleDraft(p.id)}
                >
                  <div className="pc-top">
                    <span className="pc-rank">#{p.rank || i + 1}</span>
                    {p.drafted
                      ? <span className="drafted-tag">Drafted</span>
                      : <span className="pc-pos">{p.position}</span>
                    }
                  </div>
                  <div className="pc-name">{p.name}</div>
                  <div className="pc-team">{p.team_abbreviation} · {p.team_name?.split(' ').pop()}</div>
                  <div className="pc-stats">
                    <div><div className="pc-stat-label">PTS</div><div className="pc-stat-val">{p.stats?.pts}</div></div>
                    <div><div className="pc-stat-label">REB</div><div className="pc-stat-val">{p.stats?.reb}</div></div>
                    <div><div className="pc-stat-label">AST</div><div className="pc-stat-val">{p.stats?.ast}</div></div>
                  </div>
                  <div className="pc-fpts">{p.fantasy_points} <span>FPTS/G</span></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
