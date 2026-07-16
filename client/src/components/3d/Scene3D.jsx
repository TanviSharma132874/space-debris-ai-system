import { useState, useEffect } from 'react';

/**
 * Scene3D component acts as a high-fidelity presentation layer for 3D orbital data.
 * It maps visualizationData to an interactive tactical radar grid, preparing the 
 * exact UI state, interactions, and data hooks needed for React Three Fiber.
 * 
 * @param {Object} props - Component props.
 * @param {Array} props.visualizationData - Formatted orbital nodes from the visualization adapter.
 */
export default function Scene3D({ visualizationData = [] }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [timeStr, setTimeStr] = useState('');

  // Clock updating loop
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasScientificPositions = visualizationData.some(
    (node) => node.positionSource === 'Scientific SGP4'
  );

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const heading = ((rotation % 360) + 360) % 360;
  
  const riskStyles = {
    red: {
      core: '#fb7185',
      glow: 'rgba(244,63,94,0.85)',
      text: 'text-rose-200',
      ring: 'border-rose-400/80',
    },
    orange: {
      core: '#fb923c',
      glow: 'rgba(249,115,22,0.8)',
      text: 'text-orange-200',
      ring: 'border-orange-400/80',
    },
    yellow: {
      core: '#fbbf24',
      glow: 'rgba(251,191,36,0.75)',
      text: 'text-amber-200',
      ring: 'border-amber-300/80',
    },
    green: {
      core: '#34d399',
      glow: 'rgba(16,185,129,0.7)',
      text: 'text-emerald-200',
      ring: 'border-emerald-300/80',
    },
    gray: {
      core: '#94a3b8',
      glow: 'rgba(148,163,184,0.55)',
      text: 'text-slate-200',
      ring: 'border-slate-300/70',
    },
  };

  return (
    <div className="w-full bg-[#020617] border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col space-y-4 relative min-h-[500px]">
      <style>
        {`
          @keyframes scene3dRadarSweep {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes scene3dScanPulse {
            0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(0.9); }
            50% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.05); }
          }

          @keyframes scene3dAtmosphere {
            0%, 100% { opacity: 0.6; box-shadow: 0 0 25px rgba(56,189,248,0.22), 0 0 70px rgba(37,99,235,0.1); }
            50% { opacity: 0.85; box-shadow: 0 0 35px rgba(56,189,248,0.32), 0 0 95px rgba(37,99,235,0.18); }
          }

          @keyframes scene3dObjectGlow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.25); }
          }

          @keyframes scene3dLivePulse {
            0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
            100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
          }

          @keyframes scene3dReticleSpin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}
      </style>

      {/* Title & Stats bar */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3 text-slate-400 text-xs">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-mono text-cyan-400 font-bold uppercase tracking-widest text-[10px]">
            Orbital Space Operations Console
          </span>
        </div>
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">
          System Time: <span className="text-slate-300 font-semibold">{timeStr}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Visual Map Area */}
        <div 
          className="lg:col-span-2 relative min-h-[420px] overflow-hidden rounded-xl border border-slate-800/80 bg-[#010413] shadow-[inset_0_0_120px_rgba(2,6,23,0.95)]"
          style={{ perspective: '1200px' }}
        >
          {/* Cosmic Nebula gradients */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-900/15 blur-[150px] pointer-events-none" />

          {/* High-Fidelity Tactical Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.22]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0891b2" strokeWidth="0.5" strokeDasharray="1, 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#radar-grid)" />
            
            {/* Concentric distance markers */}
            <circle cx="50%" cy="50%" r="42%" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2, 6" />
            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            <circle cx="50%" cy="50%" r="18%" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            
            {/* Axis crosshairs */}
            <line x1="50%" y1="5%" x2="50%" y2="95%" stroke="#334155" strokeWidth="0.5" strokeDasharray="4, 4" />
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#334155" strokeWidth="0.5" strokeDasharray="4, 4" />
          </svg>

          {/* Stars background */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(1px_1px_at_20px_30px,#fff,transparent),radial-gradient(1.5px_1.5px_at_100px_150px,#94a3b8,transparent),radial-gradient(1px_1px_at_250px_80px,#cbd5e1,transparent),radial-gradient(2px_2px_at_350px_280px,#fff,transparent)] pointer-events-none" />

          {/* 3D Radar Sweep Scanner */}
          <div
            className="absolute left-1/2 top-1/2 h-[480px] w-[480px] origin-center rounded-full bg-[conic-gradient(from_0deg,rgba(6,182,212,0.0)_0deg,rgba(6,182,212,0.16)_20deg,rgba(6,182,212,0.0)_40deg,rgba(6,182,212,0.0)_360deg)] pointer-events-none"
            style={{ animation: 'scene3dRadarSweep 6s linear infinite' }}
          />

          {/* Radar Scan Ring Pulser */}
          <div
            className="absolute left-1/2 top-1/2 h-[420px] w-[420px] rounded-full border border-cyan-500/10 pointer-events-none"
            style={{ animation: 'scene3dScanPulse 4.5s ease-in-out infinite' }}
          />

          {/* Tilted reference orbital planes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
            {/* LEO Ring */}
            <div 
              className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-500/15"
              style={{
                transform: `translate(-50%, -50%) rotateX(65deg) rotateY(10deg) scale(${zoom})`,
              }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[7px] text-sky-400/40 uppercase tracking-widest">LEO</span>
            </div>
            
            {/* MEO Ring */}
            <div 
              className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-indigo-400/15"
              style={{
                transform: `translate(-50%, -50%) rotateX(65deg) rotateY(10deg) scale(${zoom})`,
              }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[7px] text-indigo-400/40 uppercase tracking-widest">MEO</span>
            </div>

            {/* GEO Belt */}
            <div 
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-emerald-500/10"
              style={{
                transform: `translate(-50%, -50%) rotateX(65deg) rotateY(10deg) scale(${zoom})`,
              }}
            >
              <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[7px] text-emerald-400/30 uppercase tracking-widest">GEO</span>
            </div>
          </div>

          {/* Earth Globe Sphere */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 20 }}>
            {/* Exosphere Glow */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-cyan-500/5 border border-cyan-500/10 blur-sm"
              style={{
                animation: 'scene3dAtmosphere 5s ease-in-out infinite',
                transform: `translate(-50%, -50%) scale(${zoom})`,
              }}
            />
            
            {/* Stratosphere Shell */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[152px] w-[152px] rounded-full border border-sky-400/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              style={{
                transform: `translate(-50%, -50%) scale(${zoom})`,
              }}
            />

            {/* Globe Earth body */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full overflow-hidden border border-sky-300/30"
              style={{
                transform: `translate(-50%, -50%) scale(${zoom}) rotate(${rotation}deg)`,
                background: 'radial-gradient(circle at 35% 35%, #1e40af 0%, #0f172a 70%, #020617 100%)',
                boxShadow: 'inset 0 0 20px rgba(56,189,248,0.4), inset -10px -10px 30px rgba(0,0,0,0.95), 0 0 30px rgba(37,99,235,0.15)',
              }}
            >
              {/* Continental Map Overlay Grid */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.35]" viewBox="0 0 100 100">
                <defs>
                  <radialGradient id="earth-shadow" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="65%" stopColor="rgba(0,0,0,0.55)" />
                    <stop offset="100%" stopColor="rgba(2,6,23,0.98)" />
                  </radialGradient>
                </defs>
                {/* Horizontal Latitudes */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                {/* Vertical Longitudes */}
                <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                <ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1,2" />
                
                {/* Reference Meridians */}
                <line x1="50" y1="5" x2="50" y2="95" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="2,2" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="2,2" />
                
                {/* Darkness / Shading Layer overlay */}
                <rect width="100" height="100" fill="url(#earth-shadow)" />
              </svg>
              {/* Day/Night terminator highlight */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-transparent to-cyan-500/10 pointer-events-none" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.85)]" />
              
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/80">
                Earth
              </span>
            </div>
          </div>

          {/* HUD Left - Orientation Indicator */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-1 rounded-lg border border-slate-800/80 bg-slate-950/85 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-300 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">N</span>
              <span className="h-4 w-px bg-slate-800" />
              <span className="text-slate-400">Ref: Orbit North</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] text-slate-500">
              <span>ECI FRAME</span>
              <span>•</span>
              <span>GEOCENTRIC</span>
            </div>
          </div>

          {/* HUD Right - Camera Heading Tape */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-1 rounded-lg border border-slate-800/80 bg-slate-950/85 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-300 backdrop-blur-md min-w-[125px]">
            <div className="flex justify-between items-center text-[8px] text-slate-500">
              <span>Bearing</span>
              <span className="text-orange-400 font-bold">{Math.round(heading).toString().padStart(3, '0')}°</span>
            </div>
            {/* Sliding compass scale */}
            <div className="relative h-5 bg-slate-900 border border-slate-800/60 rounded overflow-hidden flex items-center justify-center">
              <div className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10" />
              <div 
                className="flex gap-4 text-[7px] text-slate-500 transition-transform duration-300 font-bold" 
                style={{ transform: `translateX(${(180 - heading) * 0.4}px)` }}
              >
                <span>270</span>
                <span>300</span>
                <span>330</span>
                <span className="text-orange-400">N</span>
                <span>030</span>
                <span>060</span>
                <span>090</span>
                <span>120</span>
                <span>150</span>
                <span>S</span>
                <span>210</span>
                <span>240</span>
              </div>
            </div>
          </div>

          {/* Satellite / Debris Markers Layer */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            {visualizationData.map((node) => {
              const [x = 0, y = 0, z = 0] = node.position || [0, 0, 0];
              
              // Apply ECI rotation in 3D coordinate space around Earth
              const angleRad = (rotation * Math.PI) / 180;
              const rx = x * Math.cos(angleRad) - y * Math.sin(angleRad);
              const ry = x * Math.sin(angleRad) + y * Math.cos(angleRad);
              
              const depth = Math.max(-1, Math.min(1, Number(z) || 0));
              const depthScale = 1 + depth * 0.35;
              const opacity = Math.max(0.35, Math.min(1, 0.75 + depth * 0.25));
              const markerSize = Math.max(9, Math.min(18, 12 * depthScale));
              
              const leftPos = 50 + rx * 34 * zoom;
              const topPos = 50 + ry * 31 * zoom - depth * 4;
              const riskStyle = riskStyles[node.color] || riskStyles.gray;
              const isSelected = selectedNode?.id === node.id;

              // Hide markers placed outside viewport bounds
              if (leftPos < 4 || leftPos > 96 || topPos < 4 || topPos > 96) return null;

              // Calculate tangent velocity vector for ECI display
              const vx = -ry;
              const vy = rx;
              const angleDeg = Math.atan2(vy, vx) * (180 / Math.PI);

              // Stack behind Earth if depth < 0
              const satZIndex = depth < 0 ? 15 : 30;

              const isLive = node.objectType === 'Payload' || node.objectType === 'Satellite';

              return (
                <div key={node.id}>
                  {/* Tilted orbital plane overlay when selected */}
                  {isSelected && (
                    <div
                      className="absolute left-1/2 top-1/2 rounded-full border-2 border-cyan-400/40 pointer-events-none animate-pulse"
                      style={{
                        width: `${2 * Math.sqrt(rx*rx + ry*ry) * 34 * zoom}%`,
                        height: `${2 * Math.sqrt(rx*rx + ry*ry) * 34 * zoom}%`,
                        transform: `translate(-50%, -50%) rotateX(65deg) rotateZ(${rotation}deg)`,
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)',
                        zIndex: 18,
                      }}
                    />
                  )}

                  {/* Satellite Button Object */}
                  <button
                    type="button"
                    onClick={() => handleNodeClick(node)}
                    className="group absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border transition-all duration-300 hover:scale-125"
                    style={{
                      left: `${leftPos}%`,
                      top: `${topPos}%`,
                      width: `${markerSize}px`,
                      height: `${markerSize}px`,
                      zIndex: satZIndex,
                      opacity,
                      borderColor: isSelected ? '#22d3ee' : riskStyle.core,
                      background: `radial-gradient(circle, #ffffff 0 10%, ${riskStyle.core} 35%, rgba(15,23,42,0.7) 75%)`,
                      boxShadow: `0 0 ${16 + depth * 8}px ${riskStyle.glow}, 0 0 0 ${isSelected ? 5 : 0}px rgba(34,211,238,0.2)`,
                      animation: 'scene3dObjectGlow 2.4s ease-in-out infinite',
                    }}
                    title={`${node.name} (${node.riskLevel} Risk)`}
                  >
                    {/* Heartbeat pulse rings for payload / live objects */}
                    {isLive && (
                      <span 
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                          node.riskLevel === 'Critical' ? 'border-rose-500' :
                          node.riskLevel === 'High' ? 'border-orange-500' : 'border-sky-400'
                        } w-6 h-6 opacity-0`}
                        style={{
                          animation: 'scene3dLivePulse 2.2s cubic-bezier(0.25, 0, 0.35, 1) infinite',
                        }}
                      />
                    )}

                    {/* Premium Selection Rotating Reticle */}
                    {isSelected && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-cyan-400 border-dashed rounded-md" style={{ animation: 'scene3dReticleSpin 8s linear infinite' }} />
                    )}

                    {/* Dynamic tangent velocity vector arrow */}
                    <div 
                      className="absolute pointer-events-none origin-left"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: '14px',
                        height: '1px',
                        backgroundColor: riskStyle.core,
                        opacity: 0.7,
                        transform: `rotate(${angleDeg}deg)`
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white opacity-90" />
                    </div>

                    {/* Hover indicator node labels */}
                    <span className={`absolute left-5 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded border border-slate-800 bg-slate-950/95 px-2 py-1 text-left font-mono text-[9px] uppercase tracking-[0.08em] shadow-2xl group-hover:block z-50 ${riskStyle.text}`}>
                      <span className="block max-w-[130px] truncate font-bold text-white">{node.name || 'Orbital Object'}</span>
                      <span className="block text-[8px] text-slate-400">{node.catalogNumber || '-----'} | {node.riskLevel} Risk</span>
                    </span>
                  </button>

                  {/* High-Tech selected node HUD connector & telemetry card overlay */}
                  {isSelected && (
                    <div 
                      className="absolute pointer-events-auto z-40 bg-slate-950/95 border border-cyan-500/40 rounded-md p-2.5 font-mono text-[9px] shadow-2xl backdrop-blur-md"
                      style={{
                        left: `${leftPos + 4}%`,
                        top: `${topPos - 12}%`,
                        transform: 'translate(0, -50%)',
                        minWidth: '155px'
                      }}
                    >
                      <div className="flex justify-between border-b border-cyan-500/20 pb-1 mb-1 text-[8px] text-cyan-400 font-bold uppercase tracking-wider">
                        <span>Lock Acquired</span>
                        <span>NORAD: {node.catalogNumber || 'N/A'}</span>
                      </div>
                      <div className="space-y-0.5 text-slate-300">
                        <div className="font-bold text-white truncate max-w-[135px]">{node.name}</div>
                        <div className="flex justify-between"><span>ALT:</span><span className="text-cyan-300 font-bold">{node.altitudeKm} km</span></div>
                        <div className="flex justify-between"><span>VEL:</span><span className="text-cyan-300 font-bold">{node.velocityKmPerSec} km/s</span></div>
                        <div className="flex justify-between"><span>CLASS:</span><span className="text-slate-200">{node.objectType}</span></div>
                      </div>
                      {/* Visual pointer leader line */}
                      <div className="absolute left-0 bottom-1/2 w-4 h-[1px] bg-cyan-500/40 -translate-x-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* HUD Center Top - Alarms Banner */}
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 hidden items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/85 px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 backdrop-blur-md sm:flex">
            <span className="text-slate-500 font-bold">THREAT MATRICES:</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /> High</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Low</span>
          </div>

          {/* HUD Left Bottom - System Logs */}
          <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-slate-800/80 bg-slate-950/85 p-3 font-mono text-[8px] uppercase tracking-wider text-slate-400 backdrop-blur-md grid gap-1.5 min-w-[155px]">
            <div className="text-[9px] font-bold text-cyan-400 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
              <span>CONSOLE MONITOR</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center justify-between"><span>SENSORS:</span><span className="text-slate-200">ISTRAC NET (OK)</span></div>
            <div className="flex items-center justify-between"><span>CATALOG:</span><span className="text-slate-200">{visualizationData.length} TARGETS</span></div>
            <div className="flex items-center justify-between"><span>AUTO-SCAN:</span><span className="text-cyan-400">ENABLED</span></div>
            <div className="flex items-center justify-between"><span>SOURCE:</span><span className="text-slate-200">{hasScientificPositions ? 'SGP4' : 'FALLBACK'}</span></div>
          </div>

          {/* HUD Right Bottom - Docks Navigation Controls */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/85 p-2 text-xs text-slate-300 shadow-2xl backdrop-blur-md">
            <button 
              type="button" 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
              className="h-8 w-8 rounded-md border border-slate-800 bg-slate-900/90 font-bold text-slate-100 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition duration-200"
              title="Zoom Out"
            >
              -
            </button>
            <div className="min-w-[50px] text-center font-mono text-[9px] uppercase tracking-wider">
              <span className="block text-slate-500 text-[8px]">ZOOM</span>
              <span className="text-cyan-400 font-bold">{zoom.toFixed(1)}x</span>
            </div>
            <button 
              type="button" 
              onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} 
              className="h-8 w-8 rounded-md border border-slate-800 bg-slate-900/90 font-bold text-slate-100 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition duration-200"
              title="Zoom In"
            >
              +
            </button>
            
            <div className="h-7 w-px bg-slate-800" />
            
            <button 
              type="button" 
              onClick={() => setRotation(r => (r - 15) % 360)} 
              className="h-8 w-8 rounded-md border border-slate-800 bg-slate-900/90 font-bold text-slate-100 hover:border-orange-500/50 hover:bg-orange-950/30 transition duration-200"
              title="Rotate Left"
            >
              ↺
            </button>
            <button 
              type="button" 
              onClick={() => setRotation(r => (r + 15) % 360)} 
              className="h-8 w-8 rounded-md border border-slate-800 bg-slate-900/90 font-bold text-slate-100 hover:border-orange-500/50 hover:bg-orange-950/30 transition duration-200"
              title="Rotate Right"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Tactical Info Sidebar Panel */}
        <div className="bg-[#020511]/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between text-xs space-y-4 backdrop-blur-sm">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <h3 className="font-mono font-bold text-cyan-400 uppercase tracking-widest text-[10px]">
                Object Telemetry
              </h3>
              <span className="text-[7px] font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">
                Lock status
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {selectedNode ? (
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-2">
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">Asset Designation</div>
                    <div className="font-bold text-white text-[11px] truncate">{selectedNode.name}</div>
                    <div className="flex justify-between border-t border-slate-900/60 pt-1.5 text-[9px]">
                      <span className="text-slate-400">NORAD ID:</span>
                      <span className="text-cyan-400 font-bold">{selectedNode.catalogNumber || '---'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 p-2 rounded border border-slate-900">
                      <span className="block text-[8px] text-slate-500 uppercase">Orbit Type</span>
                      <span className="font-semibold text-slate-200">{selectedNode.orbitType}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-900">
                      <span className="block text-[8px] text-slate-500 uppercase">Obj Class</span>
                      <span className="font-semibold text-slate-200">{selectedNode.objectType}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-2">
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">State Vector</div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-400">Altitude:</span>
                      <span className="text-slate-200 font-bold">{selectedNode.altitudeKm} km</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-400">Velocity:</span>
                      <span className="text-slate-200 font-bold">{selectedNode.velocityKmPerSec} km/s</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-400">Conjunction Risk:</span>
                      <span className={`font-bold capitalize ${
                        selectedNode.riskLevel === 'Critical' ? 'text-rose-400' :
                        selectedNode.riskLevel === 'High' ? 'text-orange-400' :
                        selectedNode.riskLevel === 'Medium' ? 'text-amber-400' :
                        selectedNode.riskLevel === 'Low' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>{selectedNode.riskLevel}</span>
                    </div>
                  </div>
                  
                  {/* Position Vector output with coordinates */}
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-2">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Inertial Coordinates (ECI)</span>
                    <div className="grid grid-cols-3 gap-1 text-center text-[9px] bg-slate-900 p-1.5 rounded text-slate-400 border border-slate-900/80">
                      <div>X: <span className="text-slate-200">{selectedNode.position[0].toFixed(3)}</span></div>
                      <div>Y: <span className="text-slate-200">{selectedNode.position[1].toFixed(3)}</span></div>
                      <div>Z: <span className="text-slate-200">{selectedNode.position[2].toFixed(3)}</span></div>
                    </div>
                    {/* Visual Vector crosshair projection */}
                    <div className="h-10 bg-slate-950 border border-slate-900 rounded relative overflow-hidden flex items-center justify-center">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-slate-800" />
                      {/* x vector projection */}
                      <line 
                        className="absolute left-1/2 top-1/2 h-[1px] bg-rose-500/70 origin-left" 
                        style={{ 
                          width: `${Math.min(18, Math.abs(selectedNode.position[0] * 12))}px`, 
                          transform: `rotate(${selectedNode.position[0] < 0 ? 180 : 0}deg)` 
                        }} 
                      />
                      {/* y vector projection */}
                      <line 
                        className="absolute left-1/2 top-1/2 w-[1px] bg-emerald-500/70 origin-top" 
                        style={{ 
                          height: `${Math.min(18, Math.abs(selectedNode.position[1] * 12))}px`, 
                          transform: `rotate(${selectedNode.position[1] < 0 ? 180 : 0}deg)` 
                        }} 
                      />
                      <span className="absolute bottom-0.5 right-1.5 text-[6px] text-slate-600">POS GRID PROJ</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-800 bg-slate-900/20 text-slate-500 text-lg">
                    🛰️
                  </div>
                  <p className="text-slate-500 italic text-[9px] max-w-[180px] mx-auto leading-relaxed">
                    SELECT AN ORBITAL OBJECT MARKER FROM THE VIEWPORT TO ACQUIRE TELEMETRY LOCK.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mission-Quality compact legend */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/60 space-y-2 font-mono text-[9px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Threat Index</span>
              <span className="text-[7px] text-slate-600">COV-LIMIT: 1E-5</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" /> 
                <span className="text-rose-400 font-medium">Critical</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" /> 
                <span className="text-orange-400 font-medium">High</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" /> 
                <span className="text-amber-400 font-medium">Medium</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> 
                <span className="text-emerald-400 font-medium">Low</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
