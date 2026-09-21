import { BrowserRouter as Router, Routes, Route, useLocation, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  BrainCircuit,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  ClipboardList,
  FileText,
  Gauge,
  HardHat,
  Home,
  Layers3,
  LogOut,
  MapPinned,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Login from './pages/Login';
import CorporateDashboard from './pages/CorporateDashboard';
import MineDashboard from './pages/MineDashboard';
import Inspect from './pages/Inspect';
import GISMap from './pages/Map';
import TelemetryDashboard from './pages/TelemetryDashboard';
import Tickets from './pages/Tickets';
import Compliance from './pages/Compliance';
import SafetyIntelligence from './pages/SafetyIntelligence';
import DigitalTwin from './pages/DigitalTwin';
import Landing from './pages/Landing';
import { clearSession, getInitials, getRoleLabel, getSession } from './lib/auth';

const navigation = [
  { label: 'Overview', to: '/corporate', icon: Home },
  { label: 'Mine Dashboard', to: '/mine/1', icon: Building2 },
  { label: 'Telemetry', to: '/telemetry', icon: Activity },
  { label: 'Inspections', to: '/inspect', icon: ClipboardList },
  { label: 'Tickets', to: '/tickets', icon: ShieldAlert },
  { label: 'Compliance', to: '/compliance', icon: FileText },
  { label: 'Risk & GIS', to: '/map', icon: MapPinned },
  { label: 'Safety Intelligence', to: '/safety-intelligence', icon: BrainCircuit },
  { label: 'Digital Twin', to: '/digital-twin', icon: Layers3 },
  { label: 'Khaan Netra', to: '/khaan-netra/index.html', icon: Camera, external: true },
];

function getPageMeta(pathname) {
  const meta = {
    '/': { title: 'Mine Command Center', subtitle: 'Real-time monitoring • Compliance • Risk Intelligence' },
    '/login': { title: 'CoalGuard', subtitle: 'Secure mine operations login' },
    '/corporate': { title: 'Mine Command Center', subtitle: 'Real-time monitoring • Compliance • Risk Intelligence' },
    '/telemetry': { title: 'Telemetry Overview', subtitle: 'Live asset health • sensor intelligence' },
    '/inspect': { title: 'Inspection Workflow', subtitle: 'Field evidence • inspections • corrective actions' },
    '/tickets': { title: 'Corrective Actions', subtitle: 'Work orders • risk closure • action queue' },
    '/compliance': { title: 'Compliance Center', subtitle: 'DGMS • evidence • statutory reporting' },
    '/map': { title: 'Risk & GIS Map', subtitle: 'Spatial hazards • field conditions • incidents' },
    '/safety-intelligence': { title: 'Safety Intelligence', subtitle: 'RCA • explainability • action guidance' },
    '/digital-twin': { title: 'Digital Twin', subtitle: 'Mine context • worker zones • spatial risk' },
  };

  if (pathname.startsWith('/mine/')) {
    return { title: 'Mine Dashboard', subtitle: 'Operations overview • compliance • asset health' };
  }

  return meta[pathname] || meta['/'];
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession);
  const pageMeta = getPageMeta(location.pathname);
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const syncSession = () => setSession(getSession());
    window.addEventListener('auth-changed', syncSession);
    return () => window.removeEventListener('auth-changed', syncSession);
  }, []);

  if (isLoginPage) {
    return <Login />;
  }

  if (!session && !isLandingPage) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <ShieldCheck size={18} />
          </div>
          <div className="brand-copy">
            <strong>CoalGuard</strong>
            <span>Safe Mines • Smarter Governance</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, to, icon: Icon, external }) => (
            external ? (
              <a key={label} href={to} target="_blank" rel="noreferrer" className="nav-item nav-external">
                <span className="nav-icon"><Icon size={16} /></span>
                <span>{label}</span>
              </a>
            ) : (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
              >
                <span className="nav-icon"><Icon size={16} /></span>
                <span>{label}</span>
              </NavLink>
            )
          ))}
        </nav>

        <div className="sidebar-status-card">
          <div className="status-header">
            <div className="status-icon"><BrainCircuit size={18} /></div>
            <div className="status-copy">
              <strong>AI Risk Engine</strong>
              <span className="status-live"><span className="live-dot" /> Active</span>
            </div>
          </div>
          <p>Analyzing field data for safer operations.</p>
        </div>

        <div className="sidebar-footer">
          <HardHat size={20} />
          <span>Safe Mines,<br />Stronger Tomorrow</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="page-header">
            <div className="header-icon"><Gauge size={20} /></div>
            <div>
              <h1>{pageMeta.title}</h1>
              <p>{pageMeta.subtitle}</p>
            </div>
          </div>

          <div className="header-controls">
            <div className="select-box">
              <span className="select-icon"><Building2 size={14} /></span>
              <span>All mines</span>
              <ChevronDown size={14} />
            </div>
            <div className="select-box date-box">
              <span className="select-icon"><CalendarDays size={14} /></span>
              <span>01 Sep 2026 - 30 Sep 2026</span>
              <ChevronDown size={14} />
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={16} />
              <span className="badge-count">3</span>
            </button>
            {session ? <div className="user-chip">
              <div className="avatar">{getInitials(session.name)}</div>
              <div>
                <strong>{session.name}</strong>
                <span>{getRoleLabel(session.role)}</span>
              </div>
              <button className="icon-button" type="button" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LogOut size={16} />
              </button>
            </div> : <NavLink className="login-link" to="/login">Sign in</NavLink>}
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/corporate" element={<CorporateDashboard />} />
            <Route path="/mine/:mineId" element={<MineDashboard />} />
            <Route path="/inspect" element={<Inspect />} />
            <Route path="/map" element={<GISMap />} />
            <Route path="/telemetry" element={<TelemetryDashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/safety-intelligence" element={<SafetyIntelligence />} />
            <Route path="/digital-twin" element={<DigitalTwin />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
