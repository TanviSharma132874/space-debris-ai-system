import { useState } from 'react';

/**
 * Scene3D component acts as a high-fidelity presentation layer for 3D orbital data.
 * It maps visualizationData to a interactive tactical radar grid, preparing the 
 * exact UI state, interactions, and data hooks needed for React Three Fiber.
 * 
 * @param {Object} props - Component props.
 * @param {Array} props.visualizationData - Formatted orbital nodes from the visualization adapter.
 */
export default function Scene3D({ visualizationData = [] }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const hasScientificPositions = visualizationData.some(
    (node) => node.positionSource === 'Scientific SGP4'
  );

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col space-y-4 relative min-h-[480px]">
      {/* 1. Position Source Banner */}
      <div className="bg-amber-950/40 border border-amber-500/20 text-amber-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm">⚠️</span>
          <span className="font-semibold">
            Position source: {hasScientificPositions ? 'Scientific SGP4' : 'Fallback Geometry'}
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">ECI READY</span>
      </div>

      {/* Title & Stats bar */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3 text-slate-400 text-xs">
        <span className="font-mono text-indigo-400 font-bold uppercase tracking-wider">Tactical Orbital Map (3D Prep)</span>
        <span>Tracked Targets: <span className="text-slate-200 font-semibold">{visualizationData.length}</span></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Visual Map Area */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-xl relative min-h-[320px] overflow-hidden flex items-center justify-center">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-15" />
          
          {/* Earth sphere representation in the center */}
          <div 
            className="absolute w-36 h-36 rounded-full border border-indigo-500/30 bg-indigo-950/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-transform duration-500"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            {/* Latitude/longitude mock wireframe lines */}
            <div className="absolute w-full h-full rounded-full border-t border-b border-indigo-500/20" />
            <div className="absolute w-full h-full rounded-full border-l border-r border-indigo-500/20" />
            <div className="absolute w-12 h-full rounded-full border-l border-r border-indigo-500/10" />
            <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">EARTH</span>
          </div>

          {/* Render markers from visualizationData */}
          {/* TODO: Replace this placeholder container and radar/grid with a Canvas element from @react-three/fiber. */}
          {/* Mount <Canvas>, <ambientLight>, <directionalLight>, <OrbitControls>, and the Earth sphere. */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {visualizationData.map((node) => {
              const [x, y] = node.position || [0, 0];
              // Map coordinates to percentage offsets in container
              // Center is 50%, offset is scaled by zoom and coordinate multiplier
              const leftPos = 50 + x * 35 * zoom;
              const topPos = 50 + y * 35 * zoom;

              // Color mapping styling
              let borderClass = 'border-slate-500 bg-slate-400';
              if (node.color === 'red') borderClass = 'border-rose-500 bg-rose-400 shadow-[0_0_8px_#f43f5e]';
              else if (node.color === 'orange') borderClass = 'border-orange-500 bg-orange-400 shadow-[0_0_8px_#f97316]';
              else if (node.color === 'yellow') borderClass = 'border-amber-500 bg-amber-400 shadow-[0_0_8px_#fbbf24]';
              else if (node.color === 'green') borderClass = 'border-emerald-500 bg-emerald-400 shadow-[0_0_8px_#10b981]';

              // Limit render boundaries within container
              if (leftPos < 5 || leftPos > 95 || topPos < 5 || topPos > 95) return null;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeClick(node)}
                  className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-transform duration-300 hover:scale-150 pointer-events-auto -translate-x-1.5 -translate-y-1.5 ${borderClass}`}
                  style={{
                    left: `${leftPos}%`,
                    top: `${topPos}%`,
                  }}
                  title={`${node.name} (${node.riskLevel} Risk)`}
                />
              );
            })}
          </div>

          {/* Interactive controls: Rotate, Zoom, Pan placeholder */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-950/80 border border-slate-800 p-2 rounded-lg text-xs text-slate-300 z-20">
            <button 
              type="button" 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <span className="font-mono text-[10px]">ZOOM</span>
            <button 
              type="button" 
              onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} 
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded font-bold"
              title="Zoom In"
            >
              +
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <button 
              type="button" 
              onClick={() => setRotation(r => (r - 15) % 360)} 
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded font-bold"
              title="Rotate Left"
            >
              ↺
            </button>
            <span className="font-mono text-[10px]">ROT</span>
            <button 
              type="button" 
              onClick={() => setRotation(r => (r + 15) % 360)} 
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded font-bold"
              title="Rotate Right"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Tactical Info Sidebar Panel */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col justify-between text-xs space-y-4">
          <div>
            <h3 className="font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-900 pb-2 mb-3">Object Telemetry</h3>
            
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-bold text-slate-200 text-right">{selectedNode.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Catalog #:</span>
                  <span className="font-mono text-slate-200">{selectedNode.catalogNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-slate-200">{selectedNode.objectType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Orbit Type:</span>
                  <span className="text-slate-200">{selectedNode.orbitType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Level:</span>
                  <span className={`font-semibold capitalize ${
                    selectedNode.riskLevel === 'Critical' ? 'text-rose-400' :
                    selectedNode.riskLevel === 'High' ? 'text-orange-400' :
                    selectedNode.riskLevel === 'Medium' ? 'text-amber-400' :
                    selectedNode.riskLevel === 'Low' ? 'text-emerald-400' : 'text-slate-400'
                  }`}>{selectedNode.riskLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Altitude:</span>
                  <span className="text-slate-200 font-mono">{selectedNode.altitudeKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Velocity:</span>
                  <span className="text-slate-200 font-mono">{selectedNode.velocityKmPerSec} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Position Source:</span>
                  <span className="text-slate-200 font-mono">{selectedNode.positionSource || 'Fallback Geometry'}</span>
                </div>
                
                {/* 3D Vector Output */}
                <div className="border-t border-slate-900 pt-3 mt-2 space-y-1">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Position Vectors (X, Y, Z)</p>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-900 text-slate-400">
                    <div>X: {selectedNode.position[0].toFixed(4)}</div>
                    <div>Y: {selectedNode.position[1].toFixed(4)}</div>
                    <div>Z: {selectedNode.position[2].toFixed(4)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-8">Select an orbital marker to track telemetry data.</p>
            )}
          </div>

          {/* Quick threat legend */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/60 space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Legend / Threat Profile</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-rose-400 font-medium">Critical</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> <span className="text-orange-400 font-medium">High</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-amber-400 font-medium">Medium</span></span>
              <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-emerald-400 font-medium">Low</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
