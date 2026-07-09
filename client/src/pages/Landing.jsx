import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { token } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100 flex flex-col justify-between">
      {/* Space grid background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_76%_10%,rgba(99,102,241,0.12),transparent_30%),linear-gradient(135deg,#020617_0%,#030a16_46%,#020617_100%)] z-0" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:40px_40px] z-0" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent z-10" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl w-full flex-col justify-between px-6 py-12 sm:px-10 z-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="telemetry-font text-xs font-extrabold uppercase tracking-[0.3em] text-cyan-400">MISSION CONTROL CENTER</p>
            <h1 className="tech-title mt-4 text-4xl font-black uppercase tracking-wider text-white sm:text-6xl leading-[1.1]">
              Space Debris <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AI System</span>
            </h1>
          </div>
          <Link to={token ? '/dashboard' : '/mission-overview'} className="mission-landing-button shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            Enter Console
          </Link>
        </header>

        <div className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-8">
            <p className="max-w-2xl text-lg leading-relaxed text-slate-300 font-light">
              Real-time trajectory tracking, AI-powered collision prediction models, and autonomous maneuver optimization for secure aerospace assets.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: 'Live orbital catalog', desc: 'Real-time object tracking' },
                { name: 'AI risk scoring', desc: 'Predictive collision indicators' },
                { name: 'Mission audit trail', desc: 'Secure operational history' }
              ].map((item) => (
                <div key={item.name} className="relative overflow-hidden rounded-xl border border-cyan-500/10 bg-slate-950/65 p-5 backdrop-blur-xl">
                  <div className="absolute top-0 left-0 h-full w-[2px] bg-cyan-500/30" />
                  <span className="mb-3 block h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse" />
                  <p className="tech-title text-xs font-black uppercase tracking-wider text-slate-200">{item.name}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/15 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
            <div className="mb-6 flex items-center justify-between border-b border-slate-900 pb-4">
              <p className="tech-title text-xs font-extrabold uppercase tracking-widest text-cyan-300">Access Flow Protocol</p>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300 telemetry-font">
                SECURE GATE
              </span>
            </div>
            <div className="space-y-4">
              {['Landing Hub', 'Operational Overview', 'Secured Authentication', 'Access Scope Mapping', 'Live Mission Console'].map((step, index) => (
                <div key={step} className="flex items-center gap-4 py-1">
                  <span className="telemetry-font flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-950/30 text-xs font-extrabold text-cyan-300">
                    0{index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-900 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="telemetry-font tracking-wide">SECURED CLASSIFICATION // STAFF AUTHORIZED ONLY</span>
          <Link to={token ? '/dashboard' : '/mission-overview'} className="tech-title font-bold uppercase tracking-widest text-cyan-400 hover:text-white transition-colors">
            Continue to Mission Overview &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}
