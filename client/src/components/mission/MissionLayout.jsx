import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navigationItems = [
  { label: 'Mission Dashboard', path: '/dashboard', icon: 'dashboard', group: 'Operations' },
  { label: 'Orbital Catalog', path: '/orbital-objects', icon: 'catalog', group: 'Operations' },
  { label: 'Collision Analysis', path: '/collision-prediction', icon: 'warning', group: 'Operations' },
  { label: 'Digital Twin', path: '/orbital-objects?view=twin', icon: 'orbit', group: 'Workspace' },
  { label: 'Reports', path: '/collision-prediction?view=reports', icon: 'report', group: 'Workspace' },
  { label: 'System', path: '/dashboard?view=system', icon: 'system', group: 'Workspace' },
];

const routeMeta = {
  '/dashboard': {
    title: 'Mission Control Dashboard',
    kicker: 'Mission operations wall',
    mission: 'Debris Watch',
  },
  '/orbital-objects': {
    title: 'Orbital Object Catalog',
    kicker: 'TLE import, satellite health, digital twins, and orbit comparison',
    mission: 'Catalog Operations',
  },
  '/collision-prediction': {
    title: 'Collision Prediction Console',
    kicker: 'AI risk scoring, SHAP explainability, scenarios, reports, and audit trails',
    mission: 'Conjunction Analysis',
  },
};

const groupedNavigation = navigationItems.reduce((groups, item) => {
  const group = item.group || 'Mission';
  return {
    ...groups,
    [group]: [...(groups[group] || []), item],
  };
}, {});

const formatMissionElapsed = (seconds) => {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${remainingSeconds}`;
};

function BrandMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[#080D19]">
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5 text-[#94A3B8]">
        <path d="M24 7 29 18 41 23 29 28 24 41 19 28 7 23 19 18Z" fill="currentColor" opacity="0.9" />
        <circle cx="35" cy="13" r="2" fill="#FF8A00" />
      </svg>
    </div>
  );
}

function SidebarLogoMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#080D19] text-[#94A3B8]">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        <path d="M4.8 12a7.2 7.2 0 0 1 14.4 0M7.2 12a4.8 4.8 0 0 1 9.6 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M12 14.2v5.1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function NavIcon({ type }) {
  const common = 'h-4 w-4';
  const icons = {
    dashboard: (
      <path d="M4 12.5 12 5l8 7.5v6a1 1 0 0 1-1 1h-4.2v-5.2H9.2v5.2H5a1 1 0 0 1-1-1v-6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    ),
    catalog: (
      <>
        <path d="M5 6h14M5 12h14M5 18h14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="6" r="1.2" fill="currentColor" />
        <circle cx="13" cy="12" r="1.2" fill="currentColor" />
        <circle cx="17" cy="18" r="1.2" fill="currentColor" />
      </>
    ),
    warning: (
      <path d="M12 4.8 21 20H3L12 4.8Zm0 5.2v4.2m0 2.8h.01" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
    orbit: (
      <>
        <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="12" cy="12" rx="8.5" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <ellipse cx="12" cy="12" rx="3.8" ry="8.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </>
    ),
    report: (
      <path d="M7 4.5h7l3 3V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Zm7 0v3h3M8.8 12h6.4M8.8 15.5h6.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
    system: (
      <>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={common}>
      {icons[type]}
    </svg>
  );
}

function StatusPill({ tone = 'normal', label, children }) {
  const toneMeta = {
    normal: { text: 'text-[#E5E7EB]', dot: 'bg-[#22C55E]' },
    active: { text: 'text-[#E5E7EB]', dot: 'bg-[#38BDF8]' },
    advisory: { text: 'text-[#E5E7EB]', dot: 'bg-[#F59E0B]' },
    muted: { text: 'text-[#94A3B8]', dot: 'bg-[#64748B]' },
  }[tone] || { text: 'text-[#94A3B8]', dot: 'bg-[#64748B]' };

  return (
    <span className={`inline-flex h-7 items-center gap-2 rounded-md border border-white/[0.08] bg-[rgba(15,23,42,0.7)] px-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${toneMeta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneMeta.dot}`} />
      {label && <span className="text-[#64748B]">{label}</span>}
      <span>{children}</span>
    </span>
  );
}

function CommandMetric({ label, value, tone = 'muted' }) {
  return (
    <div className="hidden min-w-[112px] border-l border-white/[0.08] pl-3 md:block">
      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
      <p className={`mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] ${tone === 'active' ? 'text-[#38BDF8]' : 'text-[#E5E7EB]'}`}>
        {value}
      </p>
    </div>
  );
}

export default function MissionLayout({ children }) {
  const { pathname, search } = useLocation();
  const { user, logout } = useAuth();
  const [utcTime, setUtcTime] = useState('');
  const [missionElapsed, setMissionElapsed] = useState(0);

  // Extract clean meta metadata for screen title
  const meta = routeMeta[pathname] || routeMeta['/dashboard'];
  const role = user?.role || user?.designation || 'Mission Operator';
  const name = user?.name || user?.email || 'Authenticated Crew';
  const currentMission = meta.mission || 'Mission Operations';
  const syncState = utcTime ? 'UTC Synced' : 'Sync Pending';

  // Live UTC Clock
  useEffect(() => {
    const missionStart = Date.now();
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19));
      setMissionElapsed(Math.floor((Date.now() - missionStart) / 1000));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Custom active state checking for 6 sidebar items matching query parameters
  const isItemActive = (item) => {
    const currentPath = pathname + search;
    if (item.path.includes('?')) {
      return currentPath === item.path;
    } else {
      const hasQuery = search !== '';
      return pathname === item.path && !hasQuery;
    }
  };

  return (
    <div className="mission-shell min-h-screen bg-[#020617] text-[#F8FAFC] selection:bg-[#38BDF8]/25 selection:text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Space gradient background + glow effects */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_80%_75%,rgba(139,92,246,0.06),transparent_45%),linear-gradient(180deg,#020617_0%,#050816_50%,#000000_100%)]" />
      {/* Subtle grid pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] [background-image:linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* TOP COMMAND BAR */}
      <header className="sticky top-0 z-50 min-h-[62px] border-b border-[rgba(255,255,255,0.08)] bg-[#030712] px-5 py-2 flex items-center justify-between gap-4 select-none shrink-0 w-full">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <div className="min-w-0">
            <p className="tech-title text-[10px] font-black uppercase tracking-[0.14em] text-[#E5E7EB]">SPACE DEBRIS AI SYSTEM</p>
            <p className="text-[8px] font-medium uppercase tracking-[0.1em] text-[#94A3B8]">Mission Control Platform</p>
          </div>
        </div>

        {/* Center: mission command state */}
        <div className="hidden flex-1 items-center justify-center gap-2 xl:flex">
          <CommandMetric label="Current Mission" value={currentMission} tone="active" />
          <CommandMetric label="Active Operator" value={name} />
          <CommandMetric label="MET" value={formatMissionElapsed(missionElapsed)} />
          <StatusPill tone="muted" label="Notify">No Global Alerts</StatusPill>
          <StatusPill tone={utcTime ? 'active' : 'advisory'} label="Sync">{syncState}</StatusPill>
          <StatusPill tone="muted" label="UTC">{utcTime || '00:00:00'}</StatusPill>
        </div>

        {/* Right: operator identity and command exit */}
        <div className="flex shrink-0 items-center gap-2.5 rounded-md border border-white/[0.06] bg-[rgba(15,23,42,0.55)] px-2.5 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#080D19] text-[10px] font-bold text-[#E5E7EB]">
            {(name || 'MA').slice(0, 2).toUpperCase()}
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-[10px] font-semibold text-[#E5E7EB]">{name || 'Mission Administrator'}</p>
            <p className="text-[8px] uppercase tracking-[0.08em] text-[#94A3B8]">Role: <span className="font-semibold text-[#E5E7EB]">{role?.toUpperCase() || 'ADMIN'}</span></p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="ml-1 rounded-md border border-white/10 bg-transparent px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8] transition hover:bg-white/[0.05] hover:text-[#E5E7EB]"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Grid below Top Bar */}
      <div className="relative z-10 flex-1 flex min-h-0">
        
        {/* Sidebar */}
        <aside className="hidden w-[232px] border-r border-[rgba(255,255,255,0.08)] bg-[#030712] px-4 py-5 lg:flex lg:flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 px-1 pb-4 border-b border-white/[0.08]">
              <SidebarLogoMark />
              <div>
                <p className="tech-title text-[9px] font-black uppercase tracking-[0.12em] text-[#E5E7EB]">SPACE DEBRIS AI SYSTEM</p>
                <p className="text-[8px] font-medium text-[#94A3B8]">Mission Operations Platform</p>
              </div>
            </div>

            <nav className="space-y-4">
              {Object.entries(groupedNavigation).map(([group, items]) => (
                <div key={group}>
                  <p className="px-3 pb-1 text-[8px] font-black uppercase tracking-[0.16em] text-[#64748B]">{group}</p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <NavLink
                          key={item.label}
                          to={item.path}
                          aria-current={active ? 'page' : undefined}
                          className={`relative flex items-center gap-3 rounded-md border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                            active
                              ? 'border-[#2563EB]/35 bg-[rgba(37,99,235,0.16)] text-[#E5E7EB]'
                              : 'border-transparent bg-transparent text-[#94A3B8] hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-[#E5E7EB]'
                          }`}
                        >
                          {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#38BDF8]" />}
                          <span className={active ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}>
                            <NavIcon type={item.icon} />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* System status alert at the bottom of sidebar */}
          <div className="border-t border-white/[0.08] px-1 pt-4">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#64748B]">Operator Workspace</p>
            <div className="mt-2 grid gap-2 rounded-md border border-white/[0.06] bg-[#080D19] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Mission</span>
                <span className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[#E5E7EB]">{currentMission}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Sync</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#38BDF8]">{syncState}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">MET</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#E5E7EB]">{formatMissionElapsed(missionElapsed)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Container */}
        <div className="flex-1 flex min-w-0 flex-col">
          
          {/* Sub Header for screen context */}
          <header className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(3,7,18,0.92)] px-5 py-3">
            <div className="flex flex-col gap-2 px-1 sm:px-3 xl:flex-row xl:items-center xl:justify-between">
              
              <div className="flex items-center gap-2.5">
                <div className="lg:hidden">
                  <BrandMark />
                </div>
                <div>
                  <p className="telemetry-font text-[11px] font-medium uppercase tracking-[0.12em] text-[#94A3B8]">{meta.kicker}</p>
                  <h1 className="tech-title mt-0.5 text-2xl font-black uppercase tracking-[0.1em] text-[#E5E7EB] sm:text-[30px] sm:leading-9">{meta.title}</h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill tone="active" label="Mission">{currentMission}</StatusPill>
                <StatusPill tone="muted" label="Operator">{role?.toUpperCase() || 'MISSION OPERATOR'}</StatusPill>
                <StatusPill tone={utcTime ? 'active' : 'advisory'} label="Sync">{syncState}</StatusPill>
              </div>

            </div>
            
            {/* Mobile Navigation Tabs */}
            <nav className="flex gap-2 overflow-x-auto px-1 pt-3 pb-1 sm:px-3 lg:hidden">
              {navigationItems.map((item) => {
                const active = isItemActive(item);
                return (
                  <NavLink 
                    key={item.label} 
                    to={item.path} 
                    className={`mission-mobile-tab ${active ? 'mission-mobile-tab-active' : ''}`}
                  >
                    <span className="tech-title flex items-center gap-1.5">
                      <NavIcon type={item.icon} />
                      <span>{item.label}</span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </header>

          {/* Main Space Container */}
          <div className="mission-content min-w-0 flex-1 px-5 py-5 sm:px-7">
            {children}
          </div>

        </div>

      </div>
    </div>
  );
}
