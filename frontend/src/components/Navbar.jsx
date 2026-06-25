import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="logo">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 1c2.4 0 4.6.94 6.22 2.47C16.83 6.5 14.5 7 12 7s-4.83-.5-6.22-1.53A8.96 8.96 0 0112 3zM3 12c0-1.85.56-3.57 1.52-5C6.1 8.56 8.9 9.5 12 9.5s5.9-.94 7.48-2.5A8.96 8.96 0 0121 12c0 1.85-.56 3.57-1.52 5C17.9 15.44 15.1 14.5 12 14.5s-5.9.94-7.48 2.5A8.96 8.96 0 013 12zm9 9c-2.4 0-4.6-.94-6.22-2.47C7.17 17.5 9.5 17 12 17s4.83.5 6.22 1.53A8.96 8.96 0 0112 21z" fill="currentColor"/>
        </svg>
        NBA Fantasy Assistant
      </div>
      <div className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/draft">Draft board</NavLink>
        <NavLink to="/lineup">Lineup</NavLink>
        <NavLink to="/waivers">Waivers</NavLink>
        <NavLink to="/compare">Compare</NavLink>
        <NavLink to="/schedule">Schedule</NavLink>
      </div>
    </nav>
  );
}
