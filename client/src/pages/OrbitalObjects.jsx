import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import demoOrbitalObjects from '../data/demoOrbitalObjects';

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
      <header className="mission-panel mission-radar-surface space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="telemetry-font text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Orbital Catalog</p>
            <h1 className="tech-title text-3xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">Orbital Object Registry</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Manage tracked satellites, debris nodes, TLE imports, and orbital comparisons from a mission-control workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <span className="mission-chip">Live telemetry</span>
            <span className="mission-chip">TLE ingestion</span>
            <span className="mission-chip">Health checks</span>
            <span className="mission-chip">Orbit compare</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            type="button" 
            onClick={() => setIsFormOpen(true)}
            className="mission-landing-button"
          >
            Add Object
          </button>
          <button
            type="button"
            onClick={handleLoadDemoDataset}
            disabled={isLoadingDemo}
            className="mission-nav-button"
          >
            {isLoadingDemo ? 'Synchronizing...' : 'Load Demo Set'}
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="mission-nav-button"
          >
            Import TLE text
          </button>
          <button
            type="button"
            onClick={() => setIsSyncOpen(true)}
            className="mission-nav-button"
          >
            CelesTrak Sync
          </button>
        </div>
      </header>

      {/* Advanced Search & Filtering Dashboard Panel */}
      <section aria-label="Orbital object controls" className="mission-panel my-6 space-y-4">
        <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-cyan-300 mb-3 border-b border-slate-900/60 pb-2">Filter Telemetry Registry</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="flex flex-col">
            <label htmlFor="search-input">Search Registry</label>
            <input
              id="search-input"
              type="search"
              placeholder="Filter by name or NORAD ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Object Type Filter */}
          <div className="flex flex-col">
            <label htmlFor="object-type-select">Object Category</label>
            <select
              id="object-type-select"
              value={filterObjectType}
              onChange={(e) => setFilterObjectType(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Satellite">Active Satellite</option>
              <option value="Debris">Debris Fragment</option>
              <option value="RocketBody">Spent Rocket Body</option>
              <option value="Unknown">Unidentified Node</option>
            </select>
          </div>

          {/* Orbit Type Filter */}
          <div className="flex flex-col">
            <label htmlFor="orbit-type-select">Orbital Regime</label>
            <select
              id="orbit-type-select"
              value={filterOrbitType}
              onChange={(e) => setFilterOrbitType(e.target.value)}
            >
              <option value="All">All Regimes</option>
              <option value="LEO">LEO (Low Earth)</option>
              <option value="MEO">MEO (Medium Earth)</option>
              <option value="GEO">GEO (Geostationary)</option>
              <option value="HEO">HEO (Highly Elliptical)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label htmlFor="status-select">Operational Integrity</label>
            <select
              id="status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Operational</option>
              <option value="Inactive">Decommissioned</option>
              <option value="Decayed">Decayed / Reentered</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-900/60">
          <button
            type="button"
            onClick={handleClearFilters}
            className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-4 py-2 hover:text-slate-200"
          >
            Reset Catalog Filters
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
        <div className="mission-panel">
          <h2 className="tech-title text-base font-extrabold uppercase tracking-widest text-cyan-300 mb-4">Tracking Registry Catalog ({orbitalObjects.length} Nodes)</h2>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Object Name</th>
                  <th>Catalog #</th>
                  <th>Category</th>
                  <th>Regime</th>
                  <th>Altitude Height</th>
                  <th>Velocity Speed</th>
                  <th>Operational Status</th>
                  <th>Telemetry Health</th>
                  <th className="text-right">Tactical Workspace Actions</th>
                </tr>
              </thead>
              <tbody className="telemetry-font font-semibold text-xs">
                {orbitalObjects.map((orbitalObject) => (
                  <tr key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber} className="hover:bg-cyan-950/15">
                <td>{orbitalObject.name}</td>
                <td>{orbitalObject.catalogNumber}</td>
                <td>{orbitalObject.objectType}</td>
                <td>{orbitalObject.orbitType}</td>
                <td>{orbitalObject.altitudeKm ?? orbitalObject.altitude} km</td>
                <td>{orbitalObject.velocityKmPerSec ?? orbitalObject.velocity} km/s</td>
                <td>{orbitalObject.status}</td>
                <td>
                  {orbitalObject.objectType === 'Satellite' && orbitalObject.health ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      orbitalObject.health.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      orbitalObject.health.healthScore >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {orbitalObject.health.healthScore}%
                    </span>
                  ) : (
                    <span className="text-slate-500">--</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => handlePreviewTrajectory(orbitalObject)}
                      className="px-2 py-1 bg-indigo-950/20 border border-indigo-500/20 hover:border-indigo-400 text-indigo-300 text-[10px] font-bold rounded transition-all hover:scale-[1.03]"
                    >
                      PROJECTIONS
                    </button>
                    {orbitalObject.objectType === 'Satellite' && orbitalObject.health && (
                      <button
                        type="button"
                        onClick={() => setSelectedHealthObject(orbitalObject)}
                        className="px-2 py-1 bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-400 text-emerald-300 text-[10px] font-bold rounded transition-all hover:scale-[1.03]"
                      >
                        HEALTH
                      </button>
                    )}
                    {orbitalObject.orbitalEvents && (
                      <button
                        type="button"
                        onClick={() => setSelectedEventObject(orbitalObject)}
                        className="px-2 py-1 bg-amber-950/20 border border-amber-500/20 hover:border-amber-400 text-amber-300 text-[10px] font-bold rounded transition-all hover:scale-[1.03]"
                      >
                        EVENTS
                      </button>
                    )}
                    {orbitalObject.digitalTwin && (
                      <button
                        type="button"
                        onClick={() => setSelectedTwinObject(orbitalObject)}
                        className="px-2 py-1 bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-400 text-cyan-300 text-[10px] font-bold rounded transition-all hover:scale-[1.03]"
                      >
                        TWIN
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      {selectedTwinObject && selectedTwinObject.digitalTwin && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl w-full shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-100 tracking-tight">Digital Twin Workspace</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    selectedTwinObject.digitalTwin.missionStatus === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                    selectedTwinObject.digitalTwin.missionStatus === 'Monitoring' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' :
                    selectedTwinObject.digitalTwin.missionStatus === 'Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}>
                    Mission Status: {selectedTwinObject.digitalTwin.missionStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">Real-time Telemetry & Orbit Simulation Mirror</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold leading-none"
                onClick={handleCloseTwin}
              >
                &times;
              </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Column 1: Profile & Health Summary */}
              <div className="space-y-6 md:col-span-1">
                {/* Satellite Profile */}
                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Satellite Profile</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-semibold text-slate-200">{selectedTwinObject.digitalTwin.profile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Catalog #:</span>
                      <span className="font-mono text-slate-300">{selectedTwinObject.digitalTwin.profile.catalogNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type:</span>
                      <span className="text-slate-300">{selectedTwinObject.digitalTwin.profile.objectType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Orbit Type:</span>
                      <span className="text-indigo-400 font-semibold">{selectedTwinObject.digitalTwin.profile.orbitType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operator:</span>
                      <span className="text-slate-300 truncate max-w-[120px]" title={selectedTwinObject.digitalTwin.profile.operator}>{selectedTwinObject.digitalTwin.profile.operator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Altitude:</span>
                      <span className="text-slate-300 font-semibold">{selectedTwinObject.digitalTwin.profile.altitudeKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Velocity:</span>
                      <span className="text-slate-300 font-semibold">{selectedTwinObject.digitalTwin.profile.velocityKmPerSec} km/s</span>
                    </div>
                  </div>
                </div>

                {/* Health Summary */}
                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Health Summary</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">Health Score</span>
                      <p className={`text-2xl font-black ${
                        selectedTwinObject.digitalTwin.health.healthScore >= 80 ? 'text-emerald-400' :
                        selectedTwinObject.digitalTwin.health.healthScore >= 50 ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>
                        {selectedTwinObject.digitalTwin.health.healthScore}%
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      selectedTwinObject.digitalTwin.health.operationalStatus === 'Operational' ? 'bg-emerald-500/10 text-emerald-400' :
                      selectedTwinObject.digitalTwin.health.operationalStatus === 'Degraded' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {selectedTwinObject.digitalTwin.health.operationalStatus}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fuel Level:</span>
                      <span className="font-semibold text-slate-300">{selectedTwinObject.digitalTwin.health.fuelLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Battery:</span>
                      <span className="font-semibold text-slate-300">{selectedTwinObject.digitalTwin.health.batteryStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Comms:</span>
                      <span className="font-semibold text-slate-300">{selectedTwinObject.digitalTwin.health.communicationStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thermal:</span>
                      <span className="font-semibold text-slate-300">{selectedTwinObject.digitalTwin.health.thermalStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Events, Predictions & Recommendations */}
              <div className="space-y-6 md:col-span-1">
                {/* Active Orbital Events */}
                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Active Orbital Events</h3>
                  {selectedTwinObject.digitalTwin.orbitalEvents.events.length > 0 ? (
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                      {selectedTwinObject.digitalTwin.orbitalEvents.events.map((evt, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded text-[11px] border border-slate-800">
                          <span className="text-slate-200 font-medium truncate max-w-[110px]" title={evt}>{evt}</span>
                          <span className={`text-[9px] px-1.5 rounded font-bold ${
                            evt === 'Decaying Orbit Risk' ? 'bg-rose-500/10 text-rose-400' :
                            evt === 'Low Orbit Warning' || evt === 'Velocity Anomaly' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {evt === 'Decaying Orbit Risk' ? 'Critical' :
                             evt === 'Low Orbit Warning' || evt === 'Velocity Anomaly' ? 'High' : 'Warning'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">No active events detected.</p>
                  )}
                </div>

                {/* Latest Collision Prediction */}
                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Collision Prediction</h3>
                  {selectedTwinObject.digitalTwin.latestPrediction ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Level:</span>
                        <span className={`font-bold uppercase ${
                          selectedTwinObject.digitalTwin.latestPrediction.riskLevel === 'Critical' ? 'text-rose-400' :
                          selectedTwinObject.digitalTwin.latestPrediction.riskLevel === 'High' ? 'text-orange-400' :
                          selectedTwinObject.digitalTwin.latestPrediction.riskLevel === 'Medium' ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>{selectedTwinObject.digitalTwin.latestPrediction.riskLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Min Distance:</span>
                        <span className="font-semibold text-slate-300">{selectedTwinObject.digitalTwin.latestPrediction.minimumDistanceKm} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rel Velocity:</span>
                        <span className="font-semibold text-slate-300">{selectedTwinObject.digitalTwin.latestPrediction.relativeVelocityKmPerSec} km/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Probability:</span>
                        <span className="font-semibold text-slate-300">{(selectedTwinObject.digitalTwin.latestPrediction.collisionProbability * 100).toFixed(4)}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">No collision event records in database.</p>
                  )}
                </div>

                {/* Latest Recommendation */}
                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-2">
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">Decision Recommendation</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {selectedTwinObject.digitalTwin.latestRecommendation}
                  </p>
                </div>
              </div>

              {/* Column 3: Latest Trajectory Preview */}
              <div className="space-y-6 md:col-span-1">
                <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-lg space-y-3 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5 mb-2">Simulated Trajectory (60m)</h3>
                    {selectedTwinObject.digitalTwin.latestTrajectory.length > 0 ? (
                      <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-900 border border-slate-900 rounded font-mono text-[10px]">
                        {selectedTwinObject.digitalTwin.latestTrajectory.map((pt, idx) => (
                          <div key={idx} className="p-1.5 flex justify-between text-slate-400 hover:bg-slate-900/40">
                            <span>+{pt.timeOffsetMinutes}m</span>
                            <span className="text-slate-300">{pt.latitude}°, {pt.longitude}°</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-1">No trajectory path simulated.</p>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 italic pt-2">
                    Trajectory mirror is synchronized with current Keplerian altitude: {selectedTwinObject.digitalTwin.profile.altitudeKm} km.
                  </div>
                </div>
              </div>

            </div>

            {/* Timestamp & Actions */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800 pt-4">
              <span>Digital Twin Mirror Epoch: {new Date().toLocaleString()}</span>
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-5 py-2 rounded transition-colors"
                onClick={handleCloseTwin}
              >
                Close Digital Twin
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
