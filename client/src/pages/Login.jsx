import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const telemetryStats = [
  { label: 'Tracked Objects', value: '24,531', accent: 'text-sky-300' },
  { label: 'Active Satellites', value: '8,264', accent: 'text-emerald-300' },
  { label: 'Debris Objects', value: '16,267', accent: 'text-amber-300' },
  { label: 'High Risk Alerts', value: '12', accent: 'text-rose-300' },
];

const navItems = [
  'Mission Dashboard',
  'Orbital Objects',
  'Collision Prediction',
  'TLE Import',
  'Satellite Health',
  'Digital Twin',
  'Audit Logs',
];

function ShieldMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-12 w-12 text-sky-300">
      <path
        d="M32 5 55 15v16c0 14.3-9.2 23.6-23 28C18.2 54.6 9 45.3 9 31V15L32 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M20 36c9-15 22-19 31-15M18 25c10 3 20 8 29 19"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="32" cy="30" r="4" fill="currentColor" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user, token } = response.data;

      login(user, token);
    } catch (loginError) {
      setError(
        loginError.response?.data?.message ||
          loginError.response?.data?.error ||
          'Login failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-slate-100 flex flex-col">
      {/* Space backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_78%_8%,rgba(99,102,241,0.12),transparent_30%),linear-gradient(135deg,#020617_0%,#030a16_48%,#020617_100%)] z-0" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:44px_44px] z-0" />
      
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[16rem_1fr] z-10">
        {/* Left Sidebar */}
        <aside className="hidden border-r border-slate-900 bg-slate-950/80 px-5 py-6 backdrop-blur-2xl lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3.5 px-1.5">
            <ShieldMark />
            <div>
              <p className="tech-title text-sm font-black uppercase tracking-wide text-white leading-tight">Space Debris</p>
              <p className="tech-title text-sm font-black uppercase tracking-wide text-cyan-400 leading-tight">AI System</p>
            </div>
          </div>

          <div className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 px-2.5">
            Platform Capabilities
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item, index) => (
              <div
                key={item}
                className={`rounded-lg border px-3.5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  index === 0
                    ? 'border-cyan-500/35 bg-cyan-950/20 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.08)]'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <span className="tech-title">{item}</span>
              </div>
            ))}
          </nav>
        </aside>

        <section className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-900 bg-slate-950/35 px-6 py-4.5 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <ShieldMark />
              <div>
                <p className="tech-title text-xs font-black uppercase leading-tight text-white">Space Debris</p>
                <p className="tech-title text-xs font-black uppercase leading-tight text-cyan-400">AI System</p>
              </div>
            </div>
            
            <p className="hidden text-center text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-400 md:block telemetry-font">
              ORBITAL CONJUNCTION INTELLIGENCE RADAR GATEWAY
            </p>
            
            <div className="rounded-lg border border-emerald-500/20 bg-slate-950/80 px-4 py-2 text-right shadow-inner">
              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold">RADAR TELEMETRY</p>
              <p className="telemetry-font text-xs font-extrabold uppercase text-emerald-400">ONLINE</p>
            </div>
          </header>

          <div className="grid flex-1 grid-cols-1 gap-8 p-6 sm:p-8 xl:grid-cols-[1.15fr_0.85fr]">
            
            {/* Visualizer Block */}
            <section className="flex flex-col space-y-6">
              <div className="relative flex-1 min-h-[22rem] overflow-hidden rounded-xl border border-cyan-500/10 bg-slate-950/65 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_60%)] pointer-events-none" />
                
                {/* Orbital Rings Grid */}
                <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10 bg-[radial-gradient(circle_at_35%_25%,rgba(6,182,212,0.1),#090d16_60%)] shadow-[0_0_80px_rgba(6,182,212,0.1)] sm:h-80 sm:w-80">
                  <div className="absolute inset-8 rounded-full border border-cyan-500/5" />
                  <div className="absolute left-14 top-20 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse" />
                  <div className="absolute bottom-24 right-20 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_16px_#ef4444]" />
                </div>
                <div className="absolute left-[10%] top-[20%] h-60 w-[80%] rotate-[-15deg] rounded-[50%] border border-cyan-500/20" />
                <div className="absolute left-[6%] top-[30%] h-56 w-[88%] rotate-[12deg] rounded-[50%] border border-indigo-500/20" />

                <div className="relative">
                  <div className="max-w-[12rem] rounded-lg border border-cyan-500/15 bg-slate-950/80 px-3.5 py-2.5 backdrop-blur-md">
                    <p className="telemetry-font text-[10px] font-extrabold uppercase text-cyan-400">OBJECT TRACKER</p>
                    <p className="telemetry-font text-xs text-slate-300 font-bold mt-0.5">SAT-STARLINK-3052</p>
                    <p className="telemetry-font text-[10px] text-slate-500">ALT: 550.2 KM</p>
                  </div>
                </div>
                <div className="relative ml-auto">
                  <div className="max-w-[12rem] rounded-lg border border-rose-500/15 bg-slate-950/80 px-3.5 py-2.5 backdrop-blur-md">
                    <p className="telemetry-font text-[10px] font-extrabold uppercase text-rose-400">COLLISION THREAT</p>
                    <p className="telemetry-font text-xs text-slate-300 font-bold mt-0.5">DEB-2024-08A</p>
                    <p className="telemetry-font text-[10px] text-slate-500">ALT: 549.8 KM</p>
                  </div>
                </div>
              </div>

              {/* Mini Stats Deck */}
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {telemetryStats.map((stat) => (
                  <div key={stat.label} className="relative overflow-hidden rounded-xl border border-cyan-500/10 bg-slate-950/60 p-5 backdrop-blur-xl animate-fade-in">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                    <p className={`mt-2 text-2xl font-extrabold telemetry-font ${stat.accent}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex items-center">
              <form
                onSubmit={handleSubmit}
                className="w-full rounded-xl border border-cyan-500/15 bg-slate-950/65 p-6 shadow-2xl backdrop-blur-xl sm:p-8 space-y-6"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <ShieldMark />
                  </div>
                  <h1 className="tech-title mt-4 text-2xl font-black uppercase tracking-wider text-white">
                    MISSION <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">ACCESS</span>
                  </h1>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Crew Authentication Protocol</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Operator Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                      placeholder="operator@mission.local"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Security Token / Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
                      placeholder="Enter operational pass-key"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs text-rose-300">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-700 px-5 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 hover:from-cyan-500 hover:to-indigo-600 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Decrypting Credentials...' : 'Authenticate Operator'}
                  </button>
                </div>

                <div className="border-t border-slate-900 pt-5 text-center text-[10px] text-slate-600 uppercase tracking-wider leading-relaxed">
                  Notice: System usage is audited. Unauthorized operational access is strictly prohibited.
                </div>
              </form>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
