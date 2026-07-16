import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import demoOrbitalObjects from '../data/demoOrbitalObjects';
import { MissionPanel, SectionHeader, StatusBadge } from '../components/ui';

export default function OrbitalObjects() {
  const [orbitalObjects, setOrbitalObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [demoError, setDemoError] = useState('');

  // Filtering State
  const [searchText, setSearchText] = useState('');
  const [filterObjectType, setFilterObjectType] = useState('All');
  const [filterOrbitType, setFilterOrbitType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Comparison State
  const [comparePrimaryId, setComparePrimaryId] = useState('');
  const [compareSecondaryId, setCompareSecondaryId] = useState('');

  // Individual Add Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [objectType, setObjectType] = useState('Unknown');
  const [orbitType, setOrbitType] = useState('LEO');
  const [altitude, setAltitude] = useState('');
  const [velocity, setVelocity] = useState('');
  const [inclination, setInclination] = useState('');
  const [eccentricity, setEccentricity] = useState('');
  const [tleLine1, setTleLine1] = useState('');
  const [tleLine2, setTleLine2] = useState('');
  const [tleValidationResult, setTleValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // TLE Paste Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [tleText, setTleText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // CelesTrak Sync State
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncGroupSelection, setSyncGroupSelection] = useState('active');
  const [syncResult, setSyncResult] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  // Trajectory Preview State
  const [previewObject, setPreviewObject] = useState(null);
  const [propagationData, setPropagationData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [propDuration, setPropDuration] = useState(60);
  const [propInterval, setPropInterval] = useState(5);

  // Satellite Health State
  const [selectedHealthObject, setSelectedHealthObject] = useState(null);

  // Orbital Events State
  const [selectedEventObject, setSelectedEventObject] = useState(null);

  // Digital Twin State
  const [selectedTwinObject, setSelectedTwinObject] = useState(null);

  const [selectedObject, setSelectedObject] = useState(null);

  // Auto-initialize selectedObject when orbitalObjects loads
  useEffect(() => {
    if (orbitalObjects.length > 0 && !selectedObject) {
      setSelectedObject(orbitalObjects[0]);
    }
  }, [orbitalObjects, selectedObject]);

  const stats = useMemo(() => {
    const total = orbitalObjects.length;
    const satellites = orbitalObjects.filter(o => o.objectType === 'Satellite').length;
    const debris = orbitalObjects.filter(o => o.objectType === 'Debris').length;
    const rockets = orbitalObjects.filter(o => o.objectType === 'RocketBody' || o.objectType === 'Rocket Body').length;
    
    // Average health of satellites with health parameters
    const satellitesWithHealth = orbitalObjects.filter(o => o.objectType === 'Satellite' && o.health);
    const avgHealth = satellitesWithHealth.length > 0
      ? (satellitesWithHealth.reduce((acc, curr) => acc + (curr.health.healthScore || 0), 0) / satellitesWithHealth.length).toFixed(1) + '%'
      : '100.0% NOMINAL';

    // Format a UTC sync string
    const lastSync = total > 0 ? new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC' : 'N/A';

    return { total, satellites, debris, rockets, avgHealth, lastSync };
  }, [orbitalObjects]);

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view');

  // Fetch orbital objects with active filters
  const fetchOrbitalObjects = async (searchParams = {}) => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (searchParams.search) params.search = searchParams.search;
      if (searchParams.objectType && searchParams.objectType !== 'All') params.objectType = searchParams.objectType;
      if (searchParams.orbitType && searchParams.orbitType !== 'All') params.orbitType = searchParams.orbitType;
      if (searchParams.status && searchParams.status !== 'All') params.status = searchParams.status;

      const response = await api.get('/api/orbital-objects', { params });
      setOrbitalObjects(response.data.data || response.data);
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          fetchError.response?.data?.error ||
          'Failed to load orbital objects.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reactively fetch when filters change
  useEffect(() => {
    fetchOrbitalObjects({
      search: searchText,
      objectType: filterObjectType,
      orbitType: filterOrbitType,
      status: filterStatus,
    });
  }, [searchText, filterObjectType, filterOrbitType, filterStatus]);

  useEffect(() => {
    if (view === 'twin' && !selectedTwinObject && orbitalObjects.length > 0) {
      const targetObj = orbitalObjects.find((obj) => obj.digitalTwin) || orbitalObjects[0];
      if (targetObj) {
        setSelectedTwinObject(targetObj);
      }
    }
  }, [view, orbitalObjects, selectedTwinObject]);

  const handleCloseTwin = () => {
    setSelectedTwinObject(null);
    if (searchParams.get('view') === 'twin') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      setSearchParams(newParams);
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setFilterObjectType('All');
    setFilterOrbitType('All');
    setFilterStatus('All');
  };

  const handleLoadDemoDataset = async () => {
    setIsLoadingDemo(true);
    setDemoError('');
    setDemoResult(null);

    let created = 0;
    let skipped = 0;
    const failures = [];

    try {
      for (const demoObject of demoOrbitalObjects) {
        try {
          await api.post('/api/orbital-objects', demoObject);
          created += 1;
        } catch (demoLoadError) {
          if (demoLoadError.response?.status === 409) {
            skipped += 1;
          } else {
            failures.push(
              `${demoObject.name}: ${
                demoLoadError.response?.data?.message ||
                demoLoadError.response?.data?.error ||
                'Failed to create object'
              }`,
            );
          }
        }
      }

      await fetchOrbitalObjects({
        search: searchText,
        objectType: filterObjectType,
        orbitType: filterOrbitType,
        status: filterStatus,
      });

      setDemoResult({ created, skipped, failed: failures.length });

      if (failures.length > 0) {
        setDemoError(failures.join(' | '));
      }
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleAddObject = async (e) => {
    e.preventDefault();
    setFormError('');
    setTleValidationResult(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        catalogNumber,
        objectType,
        orbitType,
        altitudeKm: Number(altitude),
        velocityKmPerSec: Number(velocity),
        inclination: Number(inclination),
        eccentricity: Number(eccentricity),
        tleLine1,
        tleLine2,
      };

      const response = await api.post('/api/orbital-objects', payload);
      const createdData = response.data.data || response.data;
      
      if (createdData.tleValidation) {
        setTleValidationResult(createdData.tleValidation);
      }

      // Refresh list using current filter state
      await fetchOrbitalObjects({
        search: searchText,
        objectType: filterObjectType,
        orbitType: filterOrbitType,
        status: filterStatus,
      });

      // Close modal if TLE validation succeeded or wasn't provided
      if (!createdData.tleValidation || createdData.tleValidation.isValid) {
        setIsFormOpen(false);
        // Clear fields
        setName('');
        setCatalogNumber('');
        setAltitude('');
        setVelocity('');
        setInclination('');
        setEccentricity('');
        setTleLine1('');
        setTleLine2('');
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to add orbital object.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportTLE = async (e) => {
    e.preventDefault();
    setImportError('');
    setImportResult(null);
    setIsImporting(true);

    try {
      const response = await api.post('/api/orbital-objects/import-tle', { tleText });
      const data = response.data.data || response.data;
      setImportResult(data);

      // Refresh list using current filter state
      await fetchOrbitalObjects({
        search: searchText,
        objectType: filterObjectType,
        orbitType: filterOrbitType,
        status: filterStatus,
      });

      // Clear TLE text if import succeeded with no skipped items
      if (data.imported > 0 && data.skipped === 0) {
        setTleText('');
      }
    } catch (err) {
      setImportError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to import TLE data.',
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCelesTrakSync = async (e) => {
    e.preventDefault();
    setSyncError('');
    setSyncResult(null);
    setIsSyncing(true);

    try {
      const response = await api.post(`/api/orbital-objects/sync/${syncGroupSelection}`);
      const data = response.data.data || response.data;
      setSyncResult(data);

      // Refresh list using current filter state
      await fetchOrbitalObjects({
        search: searchText,
        objectType: filterObjectType,
        orbitType: filterOrbitType,
        status: filterStatus,
      });
    } catch (err) {
      setSyncError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to run CelesTrak synchronization.',
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePreviewTrajectory = async (obj) => {
    setPreviewObject(obj);
    setPropagationData(null);
    setPreviewError('');
    setIsPreviewLoading(true);
    try {
      const response = await api.get(`/api/orbital-objects/${obj._id || obj.id}/trajectory`, {
        params: {
          durationMinutes: propDuration,
          intervalMinutes: propInterval,
        }
      });
      setPropagationData(response.data.data || response.data);
    } catch (err) {
      setPreviewError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to propagate trajectory.',
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <header className="mission-panel space-y-4 border border-slate-800 bg-[#020511] p-4 rounded-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-2">
          <div>
            <p className="telemetry-font text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">Tactical Control Center</p>
            <h1 className="tech-title text-xl font-black uppercase tracking-wider text-white">Orbital Catalog Registry</h1>
          </div>
          <div className="flex items-center space-x-2 text-[8px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>FDM Telemetry Connected</span>
          </div>
        </div>

        {/* Compact Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5 font-mono text-[10px] uppercase">
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Total Objects</span>
            <span className="text-slate-100 font-bold text-xs">{stats.total}</span>
          </div>
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Active Sats</span>
            <span className="text-emerald-400 font-bold text-xs">{stats.satellites}</span>
          </div>
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Debris Nodes</span>
            <span className="text-amber-500 font-bold text-xs">{stats.debris}</span>
          </div>
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Rocket Bodies</span>
            <span className="text-slate-400 font-bold text-xs">{stats.rockets}</span>
          </div>
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded col-span-1">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Catalog Health</span>
            <span className="text-cyan-400 font-bold text-xs">{stats.avgHealth}</span>
          </div>
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded col-span-1">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Last Sync</span>
            <span className="text-slate-300 font-bold text-[9px] truncate block">{stats.lastSync}</span>
          </div>
          <div className="bg-slate-950 p-2 border border-slate-900/60 rounded col-span-1">
            <span className="block text-slate-500 text-[8px] tracking-wider mb-0.5">Selection</span>
            <span className="text-cyan-300 font-bold text-[9px] truncate block">{selectedObject ? selectedObject.name : 'NONE'}</span>
          </div>
        </div>
      </header>

      {/* OPERATOR CONTROL CONSOLE (Toolbar & Filter Strip) */}
      <section aria-label="Operator Control Console" className="mission-panel border border-slate-800 bg-[#020511] p-3 rounded-xl space-y-3 font-mono text-[10px]">
        {/* Row 1: Command Actions Toolbar */}
        <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Operator Control Panel</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(true)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-cyan-500/50 hover:text-cyan-400 transition rounded"
            >
              + ADD OBJECT
            </button>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-cyan-500/50 hover:text-cyan-400 transition rounded"
            >
              IMPORT TLE
            </button>
            <button
              type="button"
              onClick={() => setIsSyncOpen(true)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-cyan-500/50 hover:text-cyan-400 transition rounded"
            >
              CELESTRAK SYNC
            </button>
            <div className="h-4 w-px bg-slate-850" />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('comparison-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-1 bg-indigo-950/20 border border-indigo-900/40 text-indigo-400 font-bold hover:border-indigo-400 hover:text-indigo-300 transition rounded"
            >
              COMPARE WORKSPACE
            </button>
            <button
              type="button"
              onClick={() => {
                fetchOrbitalObjects({
                  search: searchText,
                  objectType: filterObjectType,
                  orbitType: filterOrbitType,
                  status: filterStatus,
                });
              }}
              className="px-2.5 py-1 bg-cyan-950/20 border border-cyan-900/40 text-cyan-400 font-bold hover:border-cyan-500 hover:text-cyan-300 transition rounded flex items-center gap-1"
            >
              ⟳ REFRESH
            </button>
          </div>
        </div>

        {/* Row 2: Filter Operator Strip */}
        <div className="flex flex-wrap gap-3 items-end bg-slate-950/40 border border-slate-900/80 p-2 rounded">
          {/* Search Box */}
          <div className="flex flex-col min-w-[150px] flex-1">
            <label htmlFor="search-input" className="text-[8px] text-slate-500 tracking-wider mb-0.5 uppercase">Search Registry</label>
            <input
              id="search-input"
              type="search"
              placeholder="Name or NORAD ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono text-[10px]"
            />
          </div>

          {/* Object Type Filter */}
          <div className="flex flex-col min-w-[120px]">
            <label htmlFor="object-type-select" className="text-[8px] text-slate-500 tracking-wider mb-0.5 uppercase">Category</label>
            <select
              id="object-type-select"
              value={filterObjectType}
              onChange={(e) => setFilterObjectType(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50 font-mono text-[10px]"
            >
              <option value="All">All Categories</option>
              <option value="Satellite">Active Satellite</option>
              <option value="Debris">Debris Fragment</option>
              <option value="RocketBody">Spent Rocket Body</option>
              <option value="Unknown">Unidentified Node</option>
            </select>
          </div>

          {/* Orbit Type Filter */}
          <div className="flex flex-col min-w-[120px]">
            <label htmlFor="orbit-type-select" className="text-[8px] text-slate-500 tracking-wider mb-0.5 uppercase">Regime</label>
            <select
              id="orbit-type-select"
              value={filterOrbitType}
              onChange={(e) => setFilterOrbitType(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50 font-mono text-[10px]"
            >
              <option value="All">All Regimes</option>
              <option value="LEO">LEO (Low Earth)</option>
              <option value="MEO">MEO (Medium Earth)</option>
              <option value="GEO">GEO (Geostationary)</option>
              <option value="HEO">HEO (Highly Elliptical)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col min-w-[120px]">
            <label htmlFor="status-select" className="text-[8px] text-slate-500 tracking-wider mb-0.5 uppercase">Operational Status</label>
            <select
              id="status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50 font-mono text-[10px]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Operational</option>
              <option value="Inactive">Decommissioned</option>
              <option value="Decayed">Decayed / Reentered</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-3 py-1 bg-slate-900 border border-slate-850 text-slate-500 hover:text-slate-300 transition rounded text-[9px] font-bold tracking-wider"
          >
            RESET FILTERS
          </button>
        </div>
      </section>

      {/* Orbit Comparison Workspace */}
      <section aria-label="Orbit Comparison Workspace" className="mission-panel my-6 space-y-4">
        <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-cyan-300 mb-2">Orbit Comparison Workspace</h2>
        <p className="text-xs text-slate-400">Select two cataloged nodes to run orbit comparisons and highlight operational anomalies.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Primary Selector */}
          <div className="flex flex-col">
            <label htmlFor="compare-primary-select">Primary Catalog Node</label>
            <select
              id="compare-primary-select"
              value={comparePrimaryId}
              onChange={(e) => setComparePrimaryId(e.target.value)}
            >
              <option value="">Select primary object...</option>
              {orbitalObjects.map(obj => (
                <option key={obj._id || obj.id} value={obj._id || obj.id}>{obj.name} (NORAD #{obj.catalogNumber})</option>
              ))}
            </select>
          </div>

          {/* Secondary Selector */}
          <div className="flex flex-col">
            <label htmlFor="compare-secondary-select">Secondary Reference Node</label>
            <select
              id="compare-secondary-select"
              value={compareSecondaryId}
              onChange={(e) => setCompareSecondaryId(e.target.value)}
            >
              <option value="">Select secondary object...</option>
              {orbitalObjects.map(obj => (
                <option key={obj._id || obj.id} value={obj._id || obj.id}>{obj.name} (NORAD #{obj.catalogNumber})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Cards */}
        {comparePrimaryId && compareSecondaryId && (
          (() => {
            const primary = orbitalObjects.find(o => (o._id || o.id) === comparePrimaryId);
            const secondary = orbitalObjects.find(o => (o._id || o.id) === compareSecondaryId);
            
            if (!primary || !secondary) return null;

            const primaryAlt = Number(primary.altitudeKm ?? primary.altitude ?? 0);
            const secondaryAlt = Number(secondary.altitudeKm ?? secondary.altitude ?? 0);
            const primaryVel = Number(primary.velocityKmPerSec ?? primary.velocity ?? 0);
            const secondaryVel = Number(secondary.velocityKmPerSec ?? secondary.velocity ?? 0);

            const altDiff = primaryAlt !== secondaryAlt;
            const velDiff = primaryVel !== secondaryVel;
            const orbitTypeDiff = primary.orbitType !== secondary.orbitType;
            const statusDiff = primary.status !== secondary.status;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900/60">
                {/* Primary Card */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 space-y-3 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/20" />
                  <h3 className="text-sm font-black text-cyan-300 border-b border-slate-900/60 pb-2">{primary.name} <span className="telemetry-font font-normal text-slate-500">(NORAD #{primary.catalogNumber})</span></h3>
                  <div className="space-y-2.5 text-xs telemetry-font">
                    <div className="flex justify-between border-b border-slate-900/30 pb-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Object Category:</span>
                      <span className="text-slate-300 font-bold">{primary.objectType}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${orbitTypeDiff ? 'bg-amber-500/5 text-amber-300 border border-amber-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Orbit Type:</span>
                      <span className="font-bold">{primary.orbitType}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${altDiff && primaryAlt > secondaryAlt ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Altitude Height:</span>
                      <span className="font-bold">{primaryAlt} km {altDiff && primaryAlt > secondaryAlt && '▲'}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${velDiff && primaryVel > secondaryVel ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Velocity Speed:</span>
                      <span className="font-bold">{primaryVel} km/s {velDiff && primaryVel > secondaryVel && '▲'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/30 pb-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Orbit Inclination:</span>
                      <span className="text-slate-300 font-bold">{primary.inclination ?? '--'}°</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/30 pb-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Eccentricity:</span>
                      <span className="text-slate-300 font-bold">{primary.eccentricity ?? '--'}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${statusDiff ? 'bg-amber-500/5 text-amber-300 border border-amber-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Integrity Status:</span>
                      <span className="font-bold">{primary.status}</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Card */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-5 space-y-3 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/20" />
                  <h3 className="text-sm font-black text-cyan-300 border-b border-slate-900/60 pb-2">{secondary.name} <span className="telemetry-font font-normal text-slate-500">(NORAD #{secondary.catalogNumber})</span></h3>
                  <div className="space-y-2.5 text-xs telemetry-font">
                    <div className="flex justify-between border-b border-slate-900/30 pb-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Object Category:</span>
                      <span className="text-slate-300 font-bold">{secondary.objectType}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${orbitTypeDiff ? 'bg-amber-500/5 text-amber-300 border border-amber-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Orbit Type:</span>
                      <span className="font-bold">{secondary.orbitType}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${altDiff && secondaryAlt > primaryAlt ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Altitude Height:</span>
                      <span className="font-bold">{secondaryAlt} km {altDiff && secondaryAlt > primaryAlt && '▲'}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${velDiff && secondaryVel > primaryVel ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Velocity Speed:</span>
                      <span className="font-bold">{secondaryVel} km/s {velDiff && secondaryVel > primaryVel && '▲'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/30 pb-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Orbit Inclination:</span>
                      <span className="text-slate-300 font-bold">{secondary.inclination ?? '--'}°</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/30 pb-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Eccentricity:</span>
                      <span className="text-slate-300 font-bold">{secondary.eccentricity ?? '--'}</span>
                    </div>
                    <div className={`flex justify-between p-1 px-2 rounded ${statusDiff ? 'bg-amber-500/5 text-amber-300 border border-amber-500/10' : 'border border-transparent'}`}>
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">Integrity Status:</span>
                      <span className="font-bold">{secondary.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </section>

      {isLoading && <p className="text-xs text-slate-500 italic py-4">Loading orbital database telemetry...</p>}
      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs font-semibold text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.08)]">{error}</p>}
      {!isLoading && !error && orbitalObjects.length === 0 && (
        <section aria-label="First run orbital object setup" className="command-empty-state my-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-cyan-300">No orbital telemetry loaded</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                The mission database is empty. Import TLE data, sync CelesTrak, or load the demo set to activate orbital comparisons and health checks.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => setIsImportOpen(true)} className="mission-nav-button flex-1 min-w-[120px]">
                Import TLE
              </button>
              <button type="button" onClick={() => setIsSyncOpen(true)} className="mission-nav-button flex-1 min-w-[120px]">
                Sync CelesTrak
              </button>
              <button type="button" onClick={handleLoadDemoDataset} disabled={isLoadingDemo} className="mission-landing-button flex-1 min-w-[120px]">
                {isLoadingDemo ? 'Syncing...' : 'Load Demo Set'}
              </button>
            </div>
          </div>
        </section>
      )}

      {demoResult && (
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300 font-semibold telemetry-font">
          TELEMETRY PROCESSED // Success nodes: {demoResult.created} | Skipped nodes: {demoResult.skipped} | Failed nodes: {demoResult.failed}.
        </p>
      )}

      {demoError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs font-semibold text-rose-300">{demoError}</p>}

      {orbitalObjects.length > 0 && (
        (() => {
          const activeObject = selectedObject || orbitalObjects[0];
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Table */}
              <div className="lg:col-span-2 mission-panel flex flex-col space-y-3">
                <h2 className="tech-title text-base font-extrabold uppercase tracking-widest text-cyan-300 mb-2">Tracking Registry Catalog ({orbitalObjects.length} Nodes)</h2>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-900 bg-slate-950/40 rounded">
                  <table className="w-full text-left border-collapse font-mono text-[10px]">
                    <thead className="sticky top-0 bg-slate-950 z-20 border-b border-slate-800 uppercase text-slate-400 text-[8px] tracking-wider">
                      <tr>
                        <th className="p-2 font-bold">Object Name</th>
                        <th className="p-2 font-bold">Catalog #</th>
                        <th className="p-2 font-bold">Category</th>
                        <th className="p-2 font-bold">Regime</th>
                        <th className="p-2 font-bold text-right">Altitude</th>
                        <th className="p-2 font-bold text-right">Velocity</th>
                        <th className="p-2 font-bold text-center">Status</th>
                        <th className="p-2 font-bold text-center">Health</th>
                        <th className="p-2 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {orbitalObjects.map((orbitalObject) => {
                        const isSelected = activeObject?._id === orbitalObject._id || activeObject?.id === orbitalObject.id;
                        const isSatellite = orbitalObject.objectType === 'Satellite';
                        
                        return (
                          <tr 
                            key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
                            onClick={() => setSelectedObject(orbitalObject)}
                            className={`cursor-pointer transition-colors duration-150 ${
                              isSelected 
                                ? 'bg-cyan-950/30 text-cyan-200 border-l-2 border-cyan-400' 
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            <td className="p-2 font-bold text-white max-w-[120px] truncate">{orbitalObject.name}</td>
                            <td className="p-2 font-mono text-[9px] text-slate-400">{orbitalObject.catalogNumber}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                orbitalObject.objectType === 'Satellite' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                                orbitalObject.objectType === 'Debris' ? 'bg-amber-950/20 text-amber-500 border-amber-900/30' :
                                'bg-slate-900/40 text-slate-400 border-slate-800'
                              }`}>
                                {orbitalObject.objectType}
                              </span>
                            </td>
                            <td className="p-2 text-indigo-300 font-semibold">{orbitalObject.orbitType}</td>
                            <td className="p-2 text-right font-mono">{Number(orbitalObject.altitudeKm ?? orbitalObject.altitude ?? 0).toFixed(0)} km</td>
                            <td className="p-2 text-right font-mono">{Number(orbitalObject.velocityKmPerSec ?? orbitalObject.velocity ?? 0).toFixed(2)} km/s</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                orbitalObject.status === 'Active' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' :
                                orbitalObject.status === 'Inactive' ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' :
                                'bg-rose-950/30 text-rose-400 border-rose-900/40'
                              }`}>
                                {orbitalObject.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              {isSatellite && orbitalObject.health ? (
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                  orbitalObject.health.healthScore >= 80 ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' :
                                  orbitalObject.health.healthScore >= 50 ? 'bg-amber-950/30 text-amber-400 border-amber-950/40' :
                                  'bg-rose-950/30 text-rose-400 border-rose-900/40'
                                }`}>
                                  {orbitalObject.health.healthScore}%
                                </span>
                              ) : (
                                <span className="text-slate-600">--</span>
                              )}
                            </td>
                            <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewTrajectory(orbitalObject)}
                                  className="px-1.5 py-0.5 bg-indigo-950/20 border border-indigo-500/20 hover:border-indigo-400 text-indigo-300 text-[8px] font-bold rounded transition-all"
                                >
                                  PROJ
                                </button>
                                {isSatellite && orbitalObject.health && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedHealthObject(orbitalObject)}
                                    className="px-1.5 py-0.5 bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-400 text-emerald-300 text-[8px] font-bold rounded transition-all"
                                  >
                                    HLTH
                                  </button>
                                )}
                                {orbitalObject.orbitalEvents && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEventObject(orbitalObject)}
                                    className="px-1.5 py-0.5 bg-amber-950/20 border border-amber-500/20 hover:border-amber-400 text-amber-300 text-[8px] font-bold rounded transition-all"
                                  >
                                    EVT
                                  </button>
                                )}
                                {orbitalObject.digitalTwin && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTwinObject(orbitalObject)}
                                    className="px-1.5 py-0.5 bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-400 text-cyan-300 text-[8px] font-bold rounded transition-all"
                                  >
                                    TWN
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Object Details Panel */}
              <div className="lg:col-span-1">
                <section className="mission-panel border border-slate-800 bg-[#020511] p-4 rounded-xl flex flex-col space-y-4 font-mono text-[10px] text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <h2 className="tech-title text-[9px] font-black uppercase tracking-widest text-cyan-400">Object Intelligence dossier</h2>
                    <span className="text-[7px] text-slate-500 font-bold bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded uppercase">SYSTEM DIRECTORY</span>
                  </div>

                  {activeObject ? (
                    <div className="space-y-4 overflow-y-auto pr-1 max-h-[580px]">
                      {/* 1. Basic Information */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-1.5 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">1. Basic Information</div>
                        <div className="font-bold text-white text-[11px] truncate">{activeObject.name}</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-slate-900/60 pt-2 text-[9px]">
                          <div className="flex justify-between"><span className="text-slate-500">NORAD ID:</span> <span className="text-slate-200 font-bold">{activeObject.catalogNumber}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">STATUS:</span> <span className="text-slate-200 font-bold">{activeObject.status}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">CLASS:</span> <span className="text-slate-200 font-bold">{activeObject.objectType}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">REGIME:</span> <span className="text-indigo-400 font-semibold">{activeObject.orbitType}</span></div>
                        </div>
                      </div>

                      {/* 2. Orbital Parameters */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-2 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">2. Orbital Parameters</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px]">
                          <div className="flex justify-between"><span className="text-slate-500">ALTITUDE:</span> <span className="text-slate-200 font-bold">{activeObject.altitudeKm ?? activeObject.altitude} km</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">VELOCITY:</span> <span className="text-slate-200 font-bold">{activeObject.velocityKmPerSec ?? activeObject.velocity} km/s</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">INC:</span> <span className="text-slate-200 font-bold">{activeObject.inclination ?? '--'}°</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">ECC:</span> <span className="text-slate-200 font-bold">{activeObject.eccentricity ?? '--'}</span></div>
                        </div>
                      </div>

                      {/* 3. Subsystem Health */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-2 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">3. Subsystem Health</div>
                        {isSatellite && activeObject.health ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-500">HEALTH SCORE:</span>
                              <span className={`font-bold ${
                                activeObject.health.healthScore >= 80 ? 'text-emerald-400' :
                                activeObject.health.healthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>{activeObject.health.healthScore}% ({activeObject.health.operationalStatus})</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[9px] pt-2 border-t border-slate-900/40">
                              <div className="flex justify-between"><span>HYDRAZINE:</span> <span className="text-slate-300 font-bold">{activeObject.health.fuelLevel}%</span></div>
                              <div className="flex justify-between"><span>BATTERY:</span> <span className="text-slate-300 font-bold">{activeObject.health.batteryStatus}</span></div>
                              <div className="flex justify-between"><span>RF COMMS:</span> <span className="text-slate-300 font-bold">{activeObject.health.communicationStatus}</span></div>
                              <div className="flex justify-between"><span>THERMAL:</span> <span className="text-slate-300 font-bold">{activeObject.health.thermalStatus}</span></div>
                            </div>
                            {activeObject.health.warnings && activeObject.health.warnings.length > 0 && (
                              <div className="border-t border-slate-900/40 pt-1.5 text-[8px] text-rose-400 space-y-1">
                                <span className="font-bold text-[8px] text-rose-500 block uppercase">Warnings:</span>
                                {activeObject.health.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-[9px] py-1">PASSIVE OBJECT // NO ACTIVE RF TRANSMITTERS OR SYSTEMS</div>
                        )}
                      </div>

                      {/* 4. Current Mission */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-1.5 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">4. Current Mission</div>
                        {activeObject.digitalTwin ? (
                          <div className="space-y-1.5 text-[9px]">
                            <div className="flex justify-between"><span>MISSION PHASE:</span><span className="text-cyan-400 font-bold">{activeObject.digitalTwin.missionStatus || 'NOMINAL TRACKING'}</span></div>
                            <div className="flex justify-between"><span>OPERATOR:</span><span className="text-slate-300 truncate max-w-[120px] font-bold" title={activeObject.digitalTwin.profile?.operator}>{activeObject.digitalTwin.profile?.operator || 'COMSAT INC'}</span></div>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-[9px] py-1">NON-COOPERATIVE NODE // NO ACTIVE MISSION REGISTRY</div>
                        )}
                      </div>

                      {/* 5. Latest Event & Anomalies */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-1.5 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">5. Latest Event</div>
                        {activeObject.orbitalEvents ? (
                          <div className="space-y-2 text-[9px]">
                            <div className="flex justify-between items-center">
                              <span>EVENT SEVERITY:</span>
                              <span className={`font-bold ${
                                activeObject.orbitalEvents.severity === 'Normal' ? 'text-emerald-400' :
                                activeObject.orbitalEvents.severity === 'Warning' ? 'text-amber-400' : 'text-rose-400'
                              }`}>{activeObject.orbitalEvents.severity}</span>
                            </div>
                            <div className="text-slate-300 border-t border-slate-900/40 pt-1.5">{activeObject.orbitalEvents.events[0] || 'No events detected'}</div>
                            <div className="text-slate-400 font-sans leading-relaxed text-[8px]">{activeObject.orbitalEvents.recommendation}</div>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-[9px] py-1">STABLE ORBIT DYNAMICS // NO ANOMALIES DETECTED</div>
                        )}
                      </div>

                      {/* 6. Risk Status */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-1.5 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">6. Risk Status</div>
                        {activeObject.digitalTwin && activeObject.digitalTwin.latestPrediction ? (
                          <div className="space-y-1.5 text-[9px]">
                            <div className="flex justify-between"><span>CONJUNCTION RISK:</span><span className="text-rose-400 font-bold">{activeObject.digitalTwin.latestPrediction.riskLevel}</span></div>
                            <div className="flex justify-between"><span>MIN DISTANCE:</span><span className="text-slate-200 font-bold">{activeObject.digitalTwin.latestPrediction.minimumDistanceKm} km</span></div>
                            <div className="flex justify-between"><span>COLLISION PROB:</span><span className="text-rose-300 font-bold">{(activeObject.digitalTwin.latestPrediction.collisionProbability * 100).toFixed(5)}%</span></div>
                          </div>
                        ) : (
                          <div className="text-emerald-400/80 font-bold text-[9px] py-1">SAFE // COVARIANCE ENVELOPE SECURED</div>
                        )}
                      </div>

                      {/* 7. Telemetry Summary & TLE Lines */}
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900/60 space-y-2 shadow-inner">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">7. Telemetry Summary</div>
                        {activeObject.tleLine1 && activeObject.tleLine2 ? (
                          <div className="space-y-1.5">
                            <div className="text-[8px] text-slate-500 font-bold">NORAD Two-Line Element Set</div>
                            <pre className="p-1.5 bg-slate-900 border border-slate-800 text-[8px] text-slate-400 rounded overflow-x-auto font-mono leading-tight whitespace-pre">
                              {activeObject.tleLine1}{'\n'}{activeObject.tleLine2}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-[9px] py-1">NO TLE RECORD LOADED ON DATABASE</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 italic">SELECT CATALOGED OBJECT FOR TELEMETRY LOCK.</div>
                  )}
                </section>
              </div>
            </div>
          );
        })()
      )}

      {/* Manual Creation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleAddObject} className="w-full max-w-lg rounded-xl border border-cyan-500/15 bg-slate-950/98 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="tech-title text-base font-extrabold uppercase tracking-widest text-cyan-300 border-b border-slate-900/60 pb-2">Manual Asset Ingestion</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Asset Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label>NORAD Catalog #</label>
                <input
                  type="text"
                  required
                  value={catalogNumber}
                  onChange={e => setCatalogNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Asset Classification</label>
                <select
                  value={objectType}
                  onChange={e => setObjectType(e.target.value)}
                >
                  <option value="Satellite">Active Satellite</option>
                  <option value="Debris">Debris Fragment</option>
                  <option value="RocketBody">Rocket Body</option>
                  <option value="Unknown">Unidentified Node</option>
                </select>
              </div>
              <div>
                <label>Orbital Regime</label>
                <select
                  value={orbitType}
                  onChange={e => setOrbitType(e.target.value)}
                >
                  <option value="LEO">LEO (Low Earth)</option>
                  <option value="MEO">MEO (Medium Earth)</option>
                  <option value="GEO">GEO (Geostationary)</option>
                  <option value="HEO">HEO (Highly Elliptical)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Altitude Height (km)</label>
                <input
                  type="number"
                  required
                  value={altitude}
                  onChange={e => setAltitude(e.target.value)}
                />
              </div>
              <div>
                <label>Velocity Speed (km/s)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={velocity}
                  onChange={e => setVelocity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Inclination (deg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={inclination}
                  onChange={e => setInclination(e.target.value)}
                />
              </div>
              <div>
                <label>Eccentricity</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={eccentricity}
                  onChange={e => setEccentricity(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-slate-900/60 pt-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 telemetry-font">TLE Parameters (Optional)</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] text-slate-500 font-medium block mb-1">TLE Line 1</label>
                  <input
                    type="text"
                    value={tleLine1}
                    onChange={e => setTleLine1(e.target.value)}
                    placeholder="1 25544U 98067A   23244.20459586  .00014761  00000-0  26305-3 0  9997"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 font-medium block mb-1">TLE Line 2</label>
                  <input
                    type="text"
                    value={tleLine2}
                    onChange={e => setTleLine2(e.target.value)}
                    placeholder="2 25544  51.6416 298.5305 0005436  71.9054  30.4075 15.49884618413233"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-300"
                  />
                </div>
              </div>
            </div>

            {tleValidationResult && (
              <div className={`p-3 rounded-lg border text-xs telemetry-font ${tleValidationResult.isValid ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/20 border-rose-500/20 text-rose-300'}`}>
                <p className="font-bold mb-1">TLE VALIDATION RESULT: {tleValidationResult.isValid ? 'VALID' : 'INVALID'}</p>
                {tleValidationResult.isValid ? (
                  <p>Sat Num: {tleValidationResult.satelliteNumber} | Epoch: {tleValidationResult.epoch}</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {tleValidationResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {formError && <p className="text-xs text-rose-400 block" role="alert">{formError}</p>}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-4 py-2 hover:text-slate-200"
                onClick={() => {
                  setIsFormOpen(false);
                  setTleValidationResult(null);
                  setFormError('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2"
              >
                {isSubmitting ? 'Syncing...' : 'Save Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TLE Paste Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleImportTLE} className="w-full max-w-lg rounded-xl border border-cyan-500/15 bg-slate-950/98 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h2 className="tech-title text-base font-extrabold uppercase tracking-widest text-cyan-300">Import TLE Dataset</h2>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300 text-xl font-bold"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportResult(null);
                  setImportError('');
                }}
              >
                &times;
              </button>
            </div>

            <div>
              <label>Paste TLE Elements Block (Multi-satellite supported)</label>
              <textarea
                required
                rows={8}
                value={tleText}
                onChange={e => setTleText(e.target.value)}
                placeholder="ISS (ZARYA)&#10;1 25544U 98067A   23244.20459586  .00014761  00000-0  26305-3 0  9997&#10;2 25544  51.6416 298.5305 0005436  71.9054  30.4075 15.49884618413233"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 min-h-[150px]"
              />
            </div>

            {importResult && (
              <div className="space-y-2 text-xs bg-slate-950 p-4 border border-slate-900 rounded-lg telemetry-font">
                <p className="font-bold text-slate-300 border-b border-slate-900 pb-1.5 mb-2">Import Summary</p>
                <div className="grid grid-cols-2 gap-2 text-slate-400 font-semibold">
                  <p>Imported Nodes: <span className="text-emerald-400">{importResult.imported}</span></p>
                  <p>Skipped Nodes: <span className="text-rose-400">{importResult.skipped}</span></p>
                </div>
                
                {importResult.satellites && importResult.satellites.length > 0 && (
                  <div className="pt-2">
                    <p className="font-semibold text-slate-400 mb-1">Parsed Satellites:</p>
                    <ul className="list-disc pl-4 text-emerald-400 space-y-0.5 max-h-[100px] overflow-y-auto">
                      {importResult.satellites.map((sat, idx) => (
                        <li key={idx}>{sat.name} ({sat.catalogNumber}) - {sat.orbitType}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="pt-2 border-t border-slate-900/60">
                    <p className="font-semibold text-rose-400 mb-1">Skipped Details / Errors:</p>
                    <ul className="list-disc pl-4 text-rose-300/80 space-y-0.5 max-h-[100px] overflow-y-auto">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {importError && <p className="text-xs text-rose-400 block" role="alert">{importError}</p>}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportResult(null);
                  setImportError('');
                }}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isImporting}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2 rounded"
              >
                {isImporting ? 'Importing...' : 'Run Import'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CelesTrak Sync Modal */}
      {isSyncOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleCelesTrakSync} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100">CelesTrak Synchronization</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200 text-xl font-bold"
                onClick={() => {
                  setIsSyncOpen(false);
                  setSyncResult(null);
                  setSyncError('');
                }}
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Select Satellite Group to Sync</label>
              <select
                value={syncGroupSelection}
                onChange={e => setSyncGroupSelection(e.target.value)}
                disabled={isSyncing}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="active">Active Satellites</option>
                <option value="stations">Space Stations</option>
                <option value="visual">Visual (100 Brightest)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                This sync retrieves real-time TLE data directly from public CelesTrak feeds. New satellites will be imported; duplicate catalog numbers will be skipped automatically. No API keys are required.
              </p>
            </div>

            {isSyncing && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3 bg-slate-950/40 border border-slate-800/60 rounded p-4">
                <div className="relative w-12 h-12 animate-pulse">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-200">Synchronizing Group: {syncGroupSelection.toUpperCase()}</p>
                  <p className="text-xs text-slate-400">Downloading feed, verifying TLE elements, and updating catalog...</p>
                </div>
              </div>
            )}

            {syncResult && (
              <div className="space-y-2 text-xs bg-slate-950 p-4 border border-slate-800 rounded">
                <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-2">Sync Results Summary</p>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-medium">
                  <p>Downloaded: <span className="text-slate-100 font-bold">{syncResult.downloaded}</span></p>
                  <p>Imported (New): <span className="text-emerald-400 font-bold">{syncResult.imported}</span></p>
                  <p>Updated: <span className="text-blue-400 font-bold">{syncResult.updated}</span></p>
                  <p>Skipped: <span className="text-amber-400 font-bold">{syncResult.skipped}</span></p>
                </div>

                {syncResult.errors && syncResult.errors.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <p className="font-semibold text-rose-400 mb-1">Errors/Skipped Details ({syncResult.errors.length}):</p>
                    <ul className="list-disc pl-4 text-rose-300/80 space-y-0.5 max-h-[100px] overflow-y-auto">
                      {syncResult.errors.slice(0, 50).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {syncResult.errors.length > 50 && (
                        <li className="italic text-slate-500">...and {syncResult.errors.length - 50} more errors.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {syncError && <p className="text-xs text-rose-400 block" role="alert">{syncError}</p>}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded"
                disabled={isSyncing}
                onClick={() => {
                  setIsSyncOpen(false);
                  setSyncResult(null);
                  setSyncError('');
                }}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSyncing}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2 rounded flex items-center space-x-2"
              >
                {isSyncing ? 'Synchronizing...' : 'Sync Now'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Trajectory Preview Modal */}
      {previewObject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-cyan-500/15 bg-slate-950/98 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h2 className="tech-title text-base font-extrabold uppercase tracking-widest text-cyan-300">Orbit Trajectory Preview: {previewObject.name}</h2>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300 text-xl font-bold"
                onClick={() => {
                  setPreviewObject(null);
                  setPropagationData(null);
                  setPreviewError('');
                }}
              >
                &times;
              </button>
            </div>

            {/* Config parameters */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-900 rounded-lg text-xs telemetry-font">
              <div className="flex flex-col">
                <label className="text-slate-400 font-bold mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={propDuration}
                  onChange={e => setPropDuration(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-slate-400 font-bold mb-1">Step Interval (minutes)</label>
                <input
                  type="number"
                  value={propInterval}
                  onChange={e => setPropInterval(Number(e.target.value))}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handlePreviewTrajectory(previewObject)}
                  disabled={isPreviewLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 border-indigo-500/30"
                >
                  {isPreviewLoading ? 'Propagating...' : 'Recalculate Path'}
                </button>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
              <p className="font-semibold uppercase tracking-wider mb-1 telemetry-font">⚠️ Non-Scientific Positioning Model</p>
              <p className="leading-relaxed">This trajectory path is generated using simplified geometric projection based on catalog speed and height variables. High-fidelity SGP4 Keplerian models will override these values on system deployment.</p>
            </div>

            {/* Results */}
            {previewError && <p className="text-xs text-rose-400" role="alert">{previewError}</p>}
            {isPreviewLoading && <p className="text-xs text-slate-500 italic telemetry-font">Re-propagating nodes...</p>}

            {propagationData && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 telemetry-font bg-slate-950/40 p-3 rounded border border-slate-900">
                  <p>Propagation Engine: <span className="font-bold text-amber-400">{propagationData.supported ? 'Keplerian' : 'Mock Simulator'}</span></p>
                  <p>Status Integrity: <span className="font-bold text-indigo-400">{propagationData.source || 'Offline Simulator'}</span></p>
                  <p>Scope Duration: <span className="font-bold text-slate-200">{propDuration} minutes</span></p>
                  <p>Interval Period: <span className="font-bold text-slate-200">{propInterval} minutes</span></p>
                </div>
                
                <div className="border border-slate-900 rounded-lg overflow-hidden">
                  <div className="bg-slate-950 p-2.5 border-b border-slate-900 text-xs font-bold text-slate-400 flex justify-between">
                    <span>Generated Coordinates ({propagationData.placeholderTrajectory?.length || 0} nodes)</span>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-900 font-mono text-[11px] bg-slate-950/30 telemetry-font">
                    {propagationData.placeholderTrajectory && propagationData.placeholderTrajectory.map((point, idx) => (
                      <div key={idx} className="p-2 flex justify-between text-slate-300 hover:bg-cyan-950/5">
                        <span className="text-slate-500">{new Date(point.timestamp).toLocaleTimeString()} (+{point.timeOffsetMinutes}m)</span>
                        <span className="text-slate-200">LAT: {point.latitude.toFixed(2)}° | LON: {point.longitude.toFixed(2)}°</span>
                        <span className="text-cyan-400">{point.altitudeKm} km | {point.velocityKmPerSec} km/s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-900">
              <button
                type="button"
                className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-4 py-2 hover:text-slate-200"
                onClick={() => {
                  setPreviewObject(null);
                  setPropagationData(null);
                  setPreviewError('');
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Satellite Health Card Modal */}
      {selectedHealthObject && selectedHealthObject.health && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-cyan-500/15 bg-slate-950/98 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div>
                <h2 className="tech-title text-base font-extrabold uppercase tracking-widest text-cyan-300">Satellite Health Diagnostics</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5 telemetry-font">{selectedHealthObject.name} // NORAD ID {selectedHealthObject.catalogNumber}</p>
              </div>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300 text-xl font-bold"
                onClick={() => setSelectedHealthObject(null)}
              >
                &times;
              </button>
            </div>

            {/* Health Score Overview */}
            <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl flex items-center justify-between shadow-inner">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest telemetry-font">Health Status Rating</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className={`text-4xl font-extrabold telemetry-font ${
                    selectedHealthObject.health.healthScore >= 80 ? 'text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]' :
                    selectedHealthObject.health.healthScore >= 50 ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    {selectedHealthObject.health.healthScore}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                    selectedHealthObject.health.operationalStatus === 'Operational' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedHealthObject.health.operationalStatus === 'Degraded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    selectedHealthObject.health.operationalStatus === 'Critical' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedHealthObject.health.operationalStatus}
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-slate-900 fill-none" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className={`fill-none transition-all duration-500 ${
                      selectedHealthObject.health.healthScore >= 80 ? 'stroke-emerald-500' :
                      selectedHealthObject.health.healthScore >= 50 ? 'stroke-amber-500' :
                      'stroke-rose-500'
                    }`}
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - selectedHealthObject.health.healthScore / 100)}
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-300 telemetry-font">{selectedHealthObject.health.healthScore}</span>
              </div>
            </div>

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Fuel Level */}
              <div className="bg-slate-950/80 border border-slate-900 p-3.5 rounded-xl flex flex-col justify-between telemetry-font">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hydrazine Fuel</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${
                      selectedHealthObject.health.fuelLevel >= 50 ? 'text-emerald-400' :
                      selectedHealthObject.health.fuelLevel >= 20 ? 'text-amber-400' :
                      'text-rose-400'
                    }`}>{selectedHealthObject.health.fuelLevel}%</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Reserved</span>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedHealthObject.health.fuelLevel >= 50 ? 'bg-emerald-500' :
                        selectedHealthObject.health.fuelLevel >= 20 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${selectedHealthObject.health.fuelLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Battery Status */}
              <div className="bg-slate-950/80 border border-slate-900 p-3.5 rounded-xl flex flex-col justify-between telemetry-font">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Battery Subsystem</span>
                <div className="mt-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    selectedHealthObject.health.batteryStatus === 'Nominal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedHealthObject.health.batteryStatus === 'Low' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedHealthObject.health.batteryStatus}
                  </span>
                </div>
              </div>

              {/* Communication Status */}
              <div className="bg-slate-950/80 border border-slate-900 p-3.5 rounded-xl flex flex-col justify-between telemetry-font">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RF Transceivers</span>
                <div className="mt-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    selectedHealthObject.health.communicationStatus === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedHealthObject.health.communicationStatus === 'Intermittent' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    selectedHealthObject.health.communicationStatus === 'Degraded' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedHealthObject.health.communicationStatus}
                  </span>
                </div>
              </div>

              {/* Thermal Status */}
              <div className="bg-slate-950/80 border border-slate-900 p-3.5 rounded-xl flex flex-col justify-between telemetry-font">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thermal Dissipation</span>
                <div className="mt-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    selectedHealthObject.health.thermalStatus === 'Nominal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedHealthObject.health.thermalStatus === 'Warm' || selectedHealthObject.health.thermalStatus === 'Cold' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedHealthObject.health.thermalStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings Section */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Active Health Warnings ({selectedHealthObject.health.warnings.length})</h3>
              {selectedHealthObject.health.warnings.length > 0 ? (
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                  {selectedHealthObject.health.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs bg-rose-500/5 border border-rose-500/10 rounded p-2 text-rose-300">
                      <span className="text-rose-400 mt-0.5">⚠️</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs bg-emerald-500/5 border border-emerald-500/10 rounded p-2 text-emerald-300">
                  <span className="text-emerald-400">✓</span>
                  <span>All subsystems operational. No active anomalies.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
                onClick={() => setSelectedHealthObject(null)}
              >
                Close Health Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orbital Events Modal */}
      {selectedEventObject && selectedEventObject.orbitalEvents && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Orbital Event Detection</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedEventObject.name} (NORAD #{selectedEventObject.catalogNumber})</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200 text-xl font-bold"
                onClick={() => setSelectedEventObject(null)}
              >
                &times;
              </button>
            </div>

            {/* Severity Status Panel */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall Severity</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-2xl font-extrabold ${
                    selectedEventObject.orbitalEvents.severity === 'Normal' ? 'text-emerald-400' :
                    selectedEventObject.orbitalEvents.severity === 'Warning' ? 'text-amber-400' :
                    selectedEventObject.orbitalEvents.severity === 'High' ? 'text-orange-400' :
                    'text-rose-400'
                  }`}>
                    {selectedEventObject.orbitalEvents.severity}
                  </span>
                  <span className={`w-3 h-3 rounded-full animate-pulse ${
                    selectedEventObject.orbitalEvents.severity === 'Normal' ? 'bg-emerald-500' :
                    selectedEventObject.orbitalEvents.severity === 'Warning' ? 'bg-amber-500' :
                    selectedEventObject.orbitalEvents.severity === 'High' ? 'bg-orange-500' :
                    'bg-rose-500'
                  }`} />
                </div>
              </div>
              <div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                  selectedEventObject.orbitalEvents.severity === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedEventObject.orbitalEvents.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  selectedEventObject.orbitalEvents.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  Status: {selectedEventObject.orbitalEvents.severity === 'Normal' ? 'Stable' : 'Action Required'}
                </span>
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-3">
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Detected Orbital Events ({selectedEventObject.orbitalEvents.events.length})</h3>
              {selectedEventObject.orbitalEvents.events.length > 0 ? (
                <div className="space-y-2">
                  {selectedEventObject.orbitalEvents.events.map((event, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                      <span className="text-sm font-semibold text-slate-200">{event}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        event === 'Decaying Orbit Risk' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        event === 'Low Orbit Warning' || event === 'Velocity Anomaly' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {event === 'Decaying Orbit Risk' ? 'Critical' :
                         event === 'Low Orbit Warning' || event === 'Velocity Anomaly' ? 'High' : 'Warning'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-emerald-300">
                  <span className="text-emerald-400">✓</span>
                  <span>No operational orbital events detected. Orbit parameters are within safety thresholds.</span>
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-lg space-y-2">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recommendation</p>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedEventObject.orbitalEvents.recommendation}
              </p>
            </div>

            {/* Timestamp */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800 pt-4">
              <span>Report Generation Time:</span>
              <span className="font-mono">{new Date().toLocaleString()}</span>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
                onClick={() => setSelectedEventObject(null)}
              >
                Close Events Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Twin Modal */}
      {selectedTwinObject && selectedTwinObject.digitalTwin && (() => {
        const twin = selectedTwinObject.digitalTwin;
        const profile = twin.profile;
        const health = twin.health;
        const events = twin.orbitalEvents?.events || [];
        const latestEvent = events[0] || 'No active events detected';
        const currentRisk = twin.latestPrediction?.riskLevel || 'No active prediction';
        const lastUpdate = new Date().toLocaleString();
        const activeAlertCount = events.length;

        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-7xl w-full shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
              <div className="flex items-start gap-3">
                <MissionPanel className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Digital Twin Workspace</p>
                      <h2 className="text-lg font-black text-slate-100 tracking-tight truncate">{profile.name}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                      <div>
                        <p className="text-slate-500 uppercase font-bold">NORAD ID</p>
                        <p className="font-mono text-slate-200">{profile.catalogNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold">Orbit Type</p>
                        <p className="font-semibold text-slate-200">{profile.orbitType}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold">Mission Status</p>
                        <StatusBadge status={twin.missionStatus}>{twin.missionStatus}</StatusBadge>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold">Current Risk</p>
                        <StatusBadge status={currentRisk}>{currentRisk}</StatusBadge>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-bold">Last Update</p>
                        <p className="font-mono text-slate-300">{lastUpdate}</p>
                      </div>
                    </div>
                  </div>
                </MissionPanel>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-200 text-2xl font-bold leading-none px-1"
                  onClick={handleCloseTwin}
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[20%_1fr_20%] gap-4">
                <div className="space-y-3">
                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Object Summary</h3>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Name</span><span className="font-semibold text-slate-200 truncate" title={profile.name}>{profile.name}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Type</span><span className="text-slate-300">{profile.objectType}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Operator</span><span className="text-slate-300 truncate" title={profile.operator}>{profile.operator}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Altitude</span><span className="font-semibold text-slate-300">{profile.altitudeKm} km</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Velocity</span><span className="font-semibold text-slate-300">{profile.velocityKmPerSec} km/s</span></div>
                    </div>
                  </MissionPanel>

                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Mission</h3>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Status</span><StatusBadge status={twin.missionStatus}>{twin.missionStatus}</StatusBadge></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Risk</span><span className="font-bold text-slate-200 uppercase">{currentRisk}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Recommendation</span><span className="text-slate-300 truncate" title={twin.latestRecommendation}>{twin.latestRecommendation}</span></div>
                    </div>
                  </MissionPanel>

                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Telemetry</h3>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Fuel</span><span className="font-semibold text-slate-300">{health.fuelLevel}%</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Battery</span><span className="font-semibold text-slate-300">{health.batteryStatus}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Comms</span><span className="font-semibold text-slate-300">{health.communicationStatus}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Thermal</span><span className="font-semibold text-slate-300">{health.thermalStatus}</span></div>
                    </div>
                  </MissionPanel>
                </div>

                <MissionPanel className="bg-slate-950 border border-slate-800/80 rounded-lg min-h-[520px] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Scene3D Container</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Visualization reserved</span>
                  </div>
                  <div className="flex-1 grid place-items-center p-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scene3D Mount Area</p>
                      <p className="text-[11px] text-slate-600 mt-1">No Scene3D invocation exists in this page.</p>
                    </div>
                  </div>
                </MissionPanel>

                <div className="space-y-3">
                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Health</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Health Score</p>
                        <p className={`text-xl font-black ${
                          health.healthScore >= 80 ? 'text-emerald-400' :
                          health.healthScore >= 50 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>{health.healthScore}%</p>
                      </div>
                      <StatusBadge status={health.operationalStatus}>{health.operationalStatus}</StatusBadge>
                    </div>
                  </MissionPanel>

                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Alerts</h3>
                    {events.length > 0 ? (
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                        {events.map((evt, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded text-[11px] border border-slate-800">
                            <span className="text-slate-200 font-medium truncate" title={evt}>{evt}</span>
                            <StatusBadge status={evt === 'Decaying Orbit Risk' ? 'Critical' : 'Warning'}>
                              {evt === 'Decaying Orbit Risk' ? 'Critical' : 'Warning'}
                            </StatusBadge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-1">No active alerts.</p>
                    )}
                  </MissionPanel>

                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Latest Event</h3>
                    <p className="text-xs text-slate-300 font-medium">{latestEvent}</p>
                    {twin.latestPrediction && (
                      <div className="space-y-1 text-[11px] pt-1">
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Min Distance</span><span className="font-semibold text-slate-300">{twin.latestPrediction.minimumDistanceKm} km</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-500">Probability</span><span className="font-semibold text-slate-300">{(twin.latestPrediction.collisionProbability * 100).toFixed(4)}%</span></div>
                      </div>
                    )}
                  </MissionPanel>

                  <MissionPanel className="bg-slate-950 p-3 border border-slate-800/80 rounded-lg space-y-2">
                    <h3 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Current Recommendation</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{twin.latestRecommendation}</p>
                  </MissionPanel>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-400 md:flex-row md:items-center md:justify-between">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 flex-1">
                  <span><span className="text-slate-600 uppercase font-bold">Simulation Status</span> <span className="font-mono text-slate-300">Synchronized</span></span>
                  <span><span className="text-slate-600 uppercase font-bold">Camera Mode</span> <span className="font-mono text-slate-300">Operator</span></span>
                  <span><span className="text-slate-600 uppercase font-bold">Tracking Mode</span> <span className="font-mono text-slate-300">{profile.orbitType}</span></span>
                  <span><span className="text-slate-600 uppercase font-bold">Last Sync</span> <span className="font-mono text-slate-300">{lastUpdate}</span></span>
                  <span><span className="text-slate-600 uppercase font-bold">Active Alerts</span> <span className="font-mono text-slate-300">{activeAlertCount}</span></span>
                </div>
                <button
                  type="button"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
                  onClick={handleCloseTwin}
                >
                  Close Digital Twin
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
