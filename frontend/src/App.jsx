import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import DraftBoard from './pages/DraftBoard';
import Lineup from './pages/Lineup';
import Compare from './pages/Compare';
import Waivers from './pages/Waivers';
import Schedule from './pages/Schedule';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/draft" element={<DraftBoard />} />
          <Route path="/lineup" element={<Lineup />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/waivers" element={<Waivers />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
