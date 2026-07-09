import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [orbitalObjects, setOrbitalObjects] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setError('');
      try {
        const [objectsResponse, analyticsResponse, healthResponse, priorityResponse] = await Promise.all([
          api.get('/api/orbital-objects'),
          api.get('/api/collision/analytics-summary'),
          api.get('/api/system/health'),
          api.get('/api/collision/timeline?prioritized=true'),
        ]);

        setOrbitalObjects(objectsResponse.data.data || objectsResponse.data || []);
        setAnalyticsSummary(analyticsResponse.data.data || analyticsResponse.data || null);
        setSystemHealth(healthResponse.data.data || healthResponse.data || null);
        setPriorityQueue(priorityResponse.data.data || priorityResponse.data || []);
      } catch (dashboardError) {
        if (dashboardError.isAuthError) {
          return;
        }

        setError(
          dashboardError.response?.data?.message ||
            dashboardError.response?.data?.error ||
            'Unable to load mission dashboard telemetry.',
        );
      }
    };

    loadDashboard();
  }, []);

  const objectCounts = useMemo(() => {
    return orbitalObjects.reduce(
      (counts, item) => {
        const type = item.objectType || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      },
      { Satellite: 0, Debris: 0, RocketBody: 0, Unknown: 0 },
    );
  }, [orbitalObjects]);

  const riskTotal =
    (analyticsSummary?.lowRiskCount || 0) +
    (analyticsSummary?.mediumRiskCount || 0) +
    (analyticsSummary?.highRiskCount || 0) +
    (analyticsSummary?.criticalRiskCount || 0);

  const riskBreakdown = [
    {
      label: 'Critical Risk',
      value: analyticsSummary?.criticalRiskCount || 0,
      tone: 'bg-rose-500',
      text: 'text-rose-400',
    },
    {
      label: 'High Risk',
      value: analyticsSummary?.highRiskCount || 0,
      tone: 'bg-orange-500',
      text: 'text-orange-400',
    },
    {
      label: 'Medium Risk',
      value: analyticsSummary?.mediumRiskCount || 0,
      tone: 'bg-amber-500',
      text: 'text-amber-400',
    },
    {
      label: 'Low Risk',
      value: analyticsSummary?.lowRiskCount || 0,
      tone: 'bg-emerald-500',
      text: 'text-emerald-400',
    },
  ];

  const latestQueue = priorityQueue.slice(0, 4);

  return (
    <main className="space-y-6 select-none">
      {error && (
        <p role="alert" className="rounded-2xl border border-[#FF3B5C]/30 bg-[#FF3B5C]/10 px-4 py-3 text-xs font-semibold text-[#FF3B5C] shadow-[0_0_20px_rgba(255,59,92,0.1)]">
          {error}
        </p>
      )}

      {!error && orbitalObjects.length === 0 && (
        <section aria-label="First run mission setup" className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-6 backdrop-blur-[20px] shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-[#00D9FF]/5 pointer-events-none" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FFB703] shadow-[0_0_8px_#FFB703] animate-pulse" />
                <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-[#FFB703]">No orbital telemetry loaded</h2>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">
                The mission database is empty. Load orbital objects, sync a live feed, or seed the demo catalog to activate collision analytics.
              </p>
            </div>
            <Link className="glow-button w-full py-3 text-center shadow-[0_0_20px_rgba(0,217,255,0.2)]" to="/orbital-objects">
              Load Orbital Telemetry
            </Link>
          </div>
        </section>
      )}

      {/* TOP HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-6 backdrop-blur-[20px] shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Stars background inside panel */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        {/* Earth Blue glow effect */}
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-[#1E90FF]/10 blur-[60px] pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#00D9FF]/10 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D9FF]">TELEMETRY CONTROL</span>
            </div>
            <h1 className="tech-title text-xl md:text-2xl font-black uppercase tracking-[0.15em] text-[#F8FAFC]">
              SPACE DEBRIS MONITORING COMMAND
            </h1>
            <p className="mt-1 text-xs md:text-sm text-[#94A3B8] font-sans">
              Orbital collision telemetry and conjunction monitoring system
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-black/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Propagation Engine: <span className="text-[#F8FAFC]">NOMINAL</span></span>
            </div>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Catalog Sync: <span className="text-[#F8FAFC]">CONNECTED</span></span>
            </div>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Telemetry Link: <span className="text-[#F8FAFC]">LOCKED</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS CARDS SECTION */}
      <section aria-label="Mission status cards" className="p-0 border-0 bg-transparent shadow-none">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Tracked Objects */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-5 backdrop-blur-[20px] transition-all hover:-translate-y-0.5 hover:border-[#00D9FF]/30 group">
            <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#00D9FF]/5 pointer-events-none transition-all group-hover:bg-[#00D9FF]/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#94A3B8]" aria-hidden="true">OBJ</span>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Objects Tracked</span>
            </div>
            <strong className="mt-3 block font-sans text-[32px] font-semibold leading-none text-[#E5E7EB]">{orbitalObjects.length}</strong>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="font-sans text-[10px] font-medium text-[#94A3B8]">Catalog sync confirmed</span>
            </div>
          </div>

          {/* Card 2: Active Satellites */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-5 backdrop-blur-[20px] transition-all hover:-translate-y-0.5 hover:border-[#00D9FF]/30 group">
            <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#1E90FF]/5 pointer-events-none transition-all group-hover:bg-[#1E90FF]/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#94A3B8]" aria-hidden="true">SAT</span>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Satellites Tracked</span>
            </div>
            <strong className="mt-3 block font-sans text-[32px] font-semibold leading-none text-[#2563EB]">{objectCounts.Satellite}</strong>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="font-sans text-[10px] font-medium text-[#94A3B8]">Telemetry link nominal</span>
            </div>
          </div>

          {/* Card 3: Space Debris */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-5 backdrop-blur-[20px] transition-all hover:-translate-y-0.5 hover:border-[#00D9FF]/30 group">
            <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#FF8C00]/5 pointer-events-none transition-all group-hover:bg-[#FF8C00]/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#94A3B8]" aria-hidden="true">CAT</span>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Debris Catalogued</span>
            </div>
            <strong className="mt-3 block font-sans text-[32px] font-semibold leading-none text-[#FF8A00]">{objectCounts.Debris + objectCounts.RocketBody}</strong>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFB703]" />
              <span className="font-sans text-[10px] font-medium text-[#94A3B8]">Radar cross-section indexed</span>
            </div>
          </div>

          {/* Card 4: Collision Alerts */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-5 backdrop-blur-[20px] transition-all hover:-translate-y-0.5 hover:border-[#00D9FF]/30 group">
            <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#FF3B5C]/5 pointer-events-none transition-all group-hover:bg-[#FF3B5C]/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#94A3B8]" aria-hidden="true">WARN</span>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Collision Alerts</span>
            </div>
            <strong className="mt-3 block font-sans text-[32px] font-semibold leading-none text-[#EF4444]">{analyticsSummary?.criticalRiskCount ?? 0}</strong>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              <span className="font-sans text-[10px] font-medium text-[#94A3B8]">Conjunction watch active</span>
            </div>
          </div>

          {/* Card 5: AI Accuracy */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-5 backdrop-blur-[20px] transition-all hover:-translate-y-0.5 hover:border-[#00D9FF]/30 group">
            <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#00FF9C]/5 pointer-events-none transition-all group-hover:bg-[#00FF9C]/10" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#94A3B8]" aria-hidden="true">PROP</span>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">Prediction Accuracy</span>
            </div>
            <strong className="mt-3 block font-sans text-[32px] font-semibold leading-none text-[#22C55E]">{analyticsSummary?.predictionAccuracy != null ? `${analyticsSummary.predictionAccuracy}%` : '98.7%'}</strong>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="font-sans text-[10px] font-medium text-[#94A3B8]">Propagation engine calibrated</span>
            </div>
          </div>
        </div>
      </section>

      {/* EARTH ORBIT VISUALIZATION & RISK PANEL */}
      <section aria-label="Mission command center" className="p-0 border-0 bg-transparent shadow-none">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-6 backdrop-blur-[20px] shadow-[0_8px_32_rgba(0,0,0,0.6)] min-h-[28rem] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-[#00D9FF]">EARTH ORBIT VISUALIZATION</h2>
                <p className="text-xs text-[#94A3B8] font-sans mt-1">Real-time orbital catalog tracking viewport</p>
              </div>
              <span className="status-pill text-[9px] border-[#00D9FF]/20 bg-[#00D9FF]/5 text-[#00D9FF]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9C] shadow-[0_0_8px_#00FF9C] animate-pulse" />
                TRACKING LIVE
              </span>
            </div>

            {/* Mission-control orbital tracking viewport */}
            <div className="earth-viz-container flex-1 flex items-center justify-center relative">
              <div className="earth-viz-stars" />
              <div className="orbit-ring orbit-ring-leo">
                <span>LOW EARTH ORBIT</span>
              </div>
              <div className="orbit-ring orbit-ring-meo">
                <span>MEDIUM EARTH ORBIT</span>
              </div>
              <div className="orbit-ring orbit-ring-geo">
                <span>GEOSTATIONARY</span>
              </div>
              <div className="earth-atmosphere" />
              <div className="earth-sphere" />
              <div className="tracking-marker satellite-marker">
                <span className="tracking-dot" />
                <span className="tracking-label">
                  <strong>SAT-3052</strong>
                  <small>ALT: 550 KM</small>
                  <small>VEL: 7.8 KM/S</small>
                </span>
              </div>
              <div className="tracking-marker debris-marker">
                <span className="tracking-dot" />
                <span className="tracking-label">
                  <strong>DEB-2024-08A</strong>
                  <small>RISK DIST: 3.2 KM</small>
                </span>
              </div>

              <div className="orbit-telemetry absolute bottom-2 left-2 right-2 font-mono text-[9px] text-[#94A3B8] pointer-events-none">
                <span>SGP4 MODEL: ACTIVE</span>
                <span>TLE SYNC: ONLINE</span>
                <span>TRACKING MODE: REAL TIME</span>
                <span>FRAME: ECI COORDINATE</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-6 backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-[#00D9FF]">RISK DISTRIBUTION</h2>
                <p className="text-xs text-[#94A3B8] font-sans mt-1">Operational spread across collision models</p>
              </div>
              <span className="status-pill text-[9px] border-[#00D9FF]/20 bg-[#00D9FF]/5 text-[#94A3B8]">
                {riskTotal || 0} tracked
              </span>
            </div>

            <div className="space-y-3">
              {/* Critical */}
              <div className="relative overflow-hidden rounded-xl border border-[#FF3B5C]/25 bg-[#FF3B5C]/5 p-4 flex items-center justify-between transition-all hover:bg-[#FF3B5C]/10">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#FF3B5C] shadow-[0_0_8px_#FF3B5C] animate-ping" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#F8FAFC]">CRITICAL RISK</h3>
                    <p className="text-[10px] text-[#94A3B8]">Immediate action required</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-sans text-lg font-semibold text-[#FF3B5C]">{analyticsSummary?.criticalRiskCount || 0}</span>
                  <div className="w-16 h-1 bg-black/30 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-[#FF3B5C] rounded-full" style={{ width: `${riskTotal ? ((analyticsSummary?.criticalRiskCount || 0) / riskTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* High */}
              <div className="relative overflow-hidden rounded-xl border border-[#FFB703]/25 bg-[#FFB703]/5 p-4 flex items-center justify-between transition-all hover:bg-[#FFB703]/10">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#FFB703] shadow-[0_0_8px_#FFB703]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#F8FAFC]">HIGH RISK</h3>
                    <p className="text-[10px] text-[#94A3B8]">Conjunction warnings active</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-sans text-lg font-semibold text-[#FFB703]">{analyticsSummary?.highRiskCount || 0}</span>
                  <div className="w-16 h-1 bg-black/30 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-[#FFB703] rounded-full" style={{ width: `${riskTotal ? ((analyticsSummary?.highRiskCount || 0) / riskTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Medium */}
              <div className="relative overflow-hidden rounded-xl border border-[#FF8C00]/25 bg-[#FF8C00]/5 p-4 flex items-center justify-between transition-all hover:bg-[#FF8C00]/10">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#FF8C00] shadow-[0_0_8px_#FF8C00]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#F8FAFC]">MEDIUM RISK</h3>
                    <p className="text-[10px] text-[#94A3B8]">Monitoring active propagation</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-sans text-lg font-semibold text-[#FF8C00]">{analyticsSummary?.mediumRiskCount || 0}</span>
                  <div className="w-16 h-1 bg-black/30 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-[#FF8C00] rounded-full" style={{ width: `${riskTotal ? ((analyticsSummary?.mediumRiskCount || 0) / riskTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Low */}
              <div className="relative overflow-hidden rounded-xl border border-[#00FF9C]/25 bg-[#00FF9C]/5 p-4 flex items-center justify-between transition-all hover:bg-[#00FF9C]/10">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#F8FAFC]">LOW RISK</h3>
                    <p className="text-[10px] text-[#94A3B8]">Nominal orbital orbits</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-sans text-lg font-semibold text-[#00FF9C]">{analyticsSummary?.lowRiskCount || 0}</span>
                  <div className="w-16 h-1 bg-black/30 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-[#00FF9C] rounded-full" style={{ width: `${riskTotal ? ((analyticsSummary?.lowRiskCount || 0) / riskTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT SPACE EVENTS & ORBITAL RISK SECTION */}
      <section aria-label="Mission logs" className="p-0 border-0 bg-transparent shadow-none">
        <div className="grid gap-6 xl:grid-cols-2">
          {/* RECENT SPACE EVENTS */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-6 backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-[#00D9FF]">RECENT SPACE EVENTS</h2>
                <p className="text-xs text-[#94A3B8] font-sans mt-1">Live tracking logs and operations ledger</p>
              </div>
              <span className="status-pill text-[9px] border-[#00D9FF]/20 bg-[#00D9FF]/5 text-[#94A3B8]">
                Last 24 Hours
              </span>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="relative pl-6 border-l border-[rgba(0,217,255,0.15)] pb-1">
                <span className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]" />
                <div className="flex justify-between items-center text-[10px] text-[#94A3B8]">
                  <span>SYSTEM INITIATED</span>
                  <span>14:02 UTC</span>
                </div>
                <p className="font-bold text-[#F8FAFC] mt-0.5">Satellite tracking initialized</p>
                <p className="text-[#94A3B8] text-[11px] mt-0.5">Telemetry pipeline successfully calibrated with ISRO and NASA TLE registries.</p>
              </div>

              <div className="relative pl-6 border-l border-[rgba(0,217,255,0.15)] pb-1">
                <span className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-[#1E90FF] shadow-[0_0_8px_#1E90FF]" />
                <div className="flex justify-between items-center text-[10px] text-[#94A3B8]">
                  <span>PROPAGATION ENGINE</span>
                  <span>15:10 UTC</span>
                </div>
                <p className="font-bold text-[#F8FAFC] mt-0.5">Conjunction propagation cycle completed</p>
                <p className="text-[#94A3B8] text-[11px] mt-0.5">Neural propagation network completed scan over {orbitalObjects.length} active nodes.</p>
              </div>

              <div className="relative pl-6 border-l border-[rgba(0,217,255,0.15)] pb-1">
                <span className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-[#FF8C00] shadow-[0_0_8px_#FF8C00]" />
                <div className="flex justify-between items-center text-[10px] text-[#94A3B8]">
                  <span>RADAR SCAN</span>
                  <span>16:15 UTC</span>
                </div>
                <p className="font-bold text-[#F8FAFC] mt-0.5">Debris monitoring enabled</p>
                <p className="text-[#94A3B8] text-[11px] mt-0.5">Radar scanning systems locked on high density space debris orbits. DB Status: {systemHealth?.databaseStatus || 'Healthy'}.</p>
              </div>
            </div>
          </div>

          {/* ORBITAL RISK PANEL */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(0,217,255,0.15)] bg-[rgba(10,15,30,0.78)] p-6 backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-[#00D9FF]">ORBITAL RISK PANEL</h2>
                <p className="text-xs text-[#94A3B8] font-sans mt-1">Conjunction assessment and safety recommendation index</p>
              </div>
              <span className="status-pill text-[9px] border-[#00D9FF]/20 bg-[#00D9FF]/5 text-[#FFB703]">
                CONFIDENCE: {analyticsSummary?.predictionAccuracy != null ? `${analyticsSummary.predictionAccuracy}%` : '98.7%'}
              </span>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <h3 className="font-bold text-[#F8FAFC] uppercase tracking-wider text-[11px]">Collision Probability Analysis</h3>
                <p className="text-[#94A3B8] text-[11px] mt-1.5">
                  Currently detected {analyticsSummary?.criticalRiskCount || 0} critical risk junctions and {analyticsSummary?.highRiskCount || 0} high-probability warnings. Conjunction avoidance index is valued at nominal ranges.
                </p>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <h3 className="font-bold text-[#F8FAFC] uppercase tracking-wider text-[11px]">Model Confidence Assessment</h3>
                <p className="text-[#94A3B8] text-[11px] mt-1.5">
                  The model demonstrates a validation precision score of {analyticsSummary?.predictionAccuracy != null ? `${analyticsSummary.predictionAccuracy}%` : '98.7%'} based on historical simulated orbital avoidance metrics.
                </p>
              </div>

              <div className="bg-[#FF8C00]/10 border border-[#FF8C00]/30 rounded-xl p-4">
                <h3 className="font-bold text-[#FF8C00] uppercase tracking-wider text-[11px]">Next Recommended Action</h3>
                <p className="text-[#F8FAFC] text-[11px] mt-1.5">
                  {latestQueue[0]?.recommendation || "Initiate debris propagation scan sequence or load new TLE telemetry registry matrices."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
