import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const capabilities = [
  'Orbital object management with TLE ingestion',
  'Collision prediction with AI confidence signals',
  'SHAP explainability and feature influence review',
  'Digital twin, satellite health, and orbit comparison workspaces',
  'Timeline, reports, alert center, system health, and audit logs',
];

export default function MissionOverview() {
  const { token } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100 flex flex-col justify-center">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(6,182,212,0.16),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.12),transparent_30%),linear-gradient(135deg,#020617_0%,#030a16_50%,#020617_100%)] z-0" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:40px_40px] z-0" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent z-10" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center z-10 w-full">
        <section className="space-y-6">
          <p className="telemetry-font text-xs font-extrabold uppercase tracking-[0.25em] text-cyan-400">OPERATIONAL OVERVIEW</p>
          <h1 className="tech-title text-4xl font-black uppercase tracking-wider text-white sm:text-5xl leading-[1.15]">
            Orbital Risk Management for Mission Operations
          </h1>
          <p className="text-base leading-relaxed text-slate-300 font-light max-w-xl">
            This workspace provides unified controls for tracking conjunctions, modeling debris path exposure, analyzing satellite health, executing simulator scenarios, and cataloging orbital assets in compliance with aerospace guidelines.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link to={token ? '/dashboard' : '/login'} className="mission-landing-button shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              {token ? 'Go to Console' : 'Secure Login'}
            </Link>
            <Link to="/" className="rounded-lg border border-slate-800 bg-slate-950/50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 transition-all duration-300 hover:border-cyan-500/30 hover:text-cyan-200">
              &larr; Back to Gate
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-cyan-500/15 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <p className="tech-title text-xs font-extrabold uppercase tracking-widest text-cyan-300">Operational Capability Index</p>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
          </div>
          <div className="space-y-3.5">
            {capabilities.map((capability) => (
              <div key={capability} className="flex gap-4 rounded-lg border border-slate-900 bg-slate-950/40 p-4 transition-all duration-300 hover:border-cyan-500/10">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <p className="text-sm font-semibold leading-relaxed text-slate-300">{capability}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
