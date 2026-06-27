import { useEffect, useState } from 'react';
import api from '../services/api';

export default function OrbitalObjects() {
  const [orbitalObjects, setOrbitalObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleClearFilters = () => {
    setSearchText('');
    setFilterObjectType('All');
    setFilterOrbitType('All');
    setFilterStatus('All');
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
    <main>
      <header className="flex justify-between items-center">
        <h1>Orbital Objects</h1>
        <div className="flex space-x-3">
          <button type="button" onClick={() => setIsFormOpen(true)}>Add Orbital Object</button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            Import TLE
          </button>
          <button
            type="button"
            onClick={() => setIsSyncOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            CelesTrak Sync
          </button>
        </div>
      </header>

      {/* Advanced Search & Filtering Dashboard Panel */}
      <section aria-label="Orbital object controls" className="my-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="flex flex-col">
            <label htmlFor="search-input" className="text-xs text-slate-400 font-medium mb-1.5">Search</label>
            <input
              id="search-input"
              type="search"
              placeholder="Search by name or catalog #"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Object Type Filter */}
          <div className="flex flex-col">
            <label htmlFor="object-type-select" className="text-xs text-slate-400 font-medium mb-1.5">Object Type</label>
            <select
              id="object-type-select"
              value={filterObjectType}
              onChange={(e) => setFilterObjectType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="All">All Types</option>
              <option value="Satellite">Satellite</option>
              <option value="Debris">Debris</option>
              <option value="RocketBody">RocketBody</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          {/* Orbit Type Filter */}
          <div className="flex flex-col">
            <label htmlFor="orbit-type-select" className="text-xs text-slate-400 font-medium mb-1.5">Orbit Type</label>
            <select
              id="orbit-type-select"
              value={filterOrbitType}
              onChange={(e) => setFilterOrbitType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="All">All Orbits</option>
              <option value="LEO">LEO</option>
              <option value="MEO">MEO</option>
              <option value="GEO">GEO</option>
              <option value="HEO">HEO</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label htmlFor="status-select" className="text-xs text-slate-400 font-medium mb-1.5">Operational Status</label>
            <select
              id="status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Decayed">Decayed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={handleClearFilters}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Orbit Comparison Workspace */}
      <section aria-label="Orbit Comparison Workspace" className="my-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Orbit Comparison Workspace</h2>
        <p className="text-xs text-slate-400">Select two orbital objects to compare their specifications and highlight differences.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Primary Selector */}
          <div className="flex flex-col">
            <label htmlFor="compare-primary-select" className="text-xs text-slate-400 font-medium mb-1.5">Primary Object</label>
            <select
              id="compare-primary-select"
              value={comparePrimaryId}
              onChange={(e) => setComparePrimaryId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Select primary object</option>
              {orbitalObjects.map(obj => (
                <option key={obj._id || obj.id} value={obj._id || obj.id}>{obj.name} ({obj.catalogNumber})</option>
              ))}
            </select>
          </div>

          {/* Secondary Selector */}
          <div className="flex flex-col">
            <label htmlFor="compare-secondary-select" className="text-xs text-slate-400 font-medium mb-1.5">Secondary Object</label>
            <select
              id="compare-secondary-select"
              value={compareSecondaryId}
              onChange={(e) => setCompareSecondaryId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Select secondary object</option>
              {orbitalObjects.map(obj => (
                <option key={obj._id || obj.id} value={obj._id || obj.id}>{obj.name} ({obj.catalogNumber})</option>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
                {/* Primary Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 shadow-inner">
                  <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2">{primary.name} ({primary.catalogNumber})</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Object Type:</span>
                      <span className="text-slate-200">{primary.objectType}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${orbitTypeDiff ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                      <span className="text-slate-400">Orbit Type:</span>
                      <span className="font-semibold">{primary.orbitType}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${altDiff && primaryAlt > secondaryAlt ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                      <span className="text-slate-400">Altitude:</span>
                      <span className="font-semibold">{primaryAlt} km {altDiff && primaryAlt > secondaryAlt && '▲'}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${velDiff && primaryVel > secondaryVel ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                      <span className="text-slate-400">Velocity:</span>
                      <span className="font-semibold">{primaryVel} km/s {velDiff && primaryVel > secondaryVel && '▲'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inclination:</span>
                      <span className="text-slate-200">{primary.inclination ?? '--'}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Eccentricity:</span>
                      <span className="text-slate-200">{primary.eccentricity ?? '--'}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${statusDiff ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold">{primary.status}</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 shadow-inner">
                  <h3 className="text-sm font-bold text-indigo-400 border-b border-slate-800 pb-2">{secondary.name} ({secondary.catalogNumber})</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Object Type:</span>
                      <span className="text-slate-200">{secondary.objectType}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${orbitTypeDiff ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                      <span className="text-slate-400">Orbit Type:</span>
                      <span className="font-semibold">{secondary.orbitType}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${altDiff && secondaryAlt > primaryAlt ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                      <span className="text-slate-400">Altitude:</span>
                      <span className="font-semibold">{secondaryAlt} km {altDiff && secondaryAlt > primaryAlt && '▲'}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${velDiff && secondaryVel > primaryVel ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                      <span className="text-slate-400">Velocity:</span>
                      <span className="font-semibold">{secondaryVel} km/s {velDiff && secondaryVel > primaryVel && '▲'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inclination:</span>
                      <span className="text-slate-200">{secondary.inclination ?? '--'}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Eccentricity:</span>
                      <span className="text-slate-200">{secondary.eccentricity ?? '--'}</span>
                    </div>
                    <div className={`flex justify-between p-1 rounded ${statusDiff ? 'bg-amber-500/10 text-amber-300' : ''}`}>
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold">{secondary.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </section>

      {isLoading && <p>Loading orbital objects...</p>}
      {error && <p role="alert">{error}</p>}
      {!isLoading && !error && orbitalObjects.length === 0 && (
        <p>No orbital objects found.</p>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Catalog Number</th>
            <th>Object Type</th>
            <th>Orbit Type</th>
            <th>Altitude</th>
            <th>Velocity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orbitalObjects.map((orbitalObject) => (
            <tr key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}>
              <td>{orbitalObject.name}</td>
              <td>{orbitalObject.catalogNumber}</td>
              <td>{orbitalObject.objectType}</td>
              <td>{orbitalObject.orbitType}</td>
              <td>{orbitalObject.altitudeKm ?? orbitalObject.altitude} km</td>
              <td>{orbitalObject.velocityKmPerSec ?? orbitalObject.velocity} km/s</td>
              <td>{orbitalObject.status}</td>
              <td>
                <button
                  type="button"
                  onClick={() => handlePreviewTrajectory(orbitalObject)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                >
                  Preview Trajectory
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Manual Creation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleAddObject} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100">Add Orbital Object</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Catalog Number</label>
                <input
                  type="text"
                  required
                  value={catalogNumber}
                  onChange={e => setCatalogNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Object Type</label>
                <select
                  value={objectType}
                  onChange={e => setObjectType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                >
                  <option value="Satellite">Satellite</option>
                  <option value="Debris">Debris</option>
                  <option value="RocketBody">RocketBody</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Orbit Type</label>
                <select
                  value={orbitType}
                  onChange={e => setOrbitType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                >
                  <option value="LEO">LEO</option>
                  <option value="MEO">MEO</option>
                  <option value="GEO">GEO</option>
                  <option value="HEO">HEO</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Altitude (km)</label>
                <input
                  type="number"
                  required
                  value={altitude}
                  onChange={e => setAltitude(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Velocity (km/s)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={velocity}
                  onChange={e => setVelocity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Inclination (deg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={inclination}
                  onChange={e => setInclination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Eccentricity</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={eccentricity}
                  onChange={e => setEccentricity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">TLE Data (Optional)</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">TLE Line 1</label>
                  <input
                    type="text"
                    value={tleLine1}
                    onChange={e => setTleLine1(e.target.value)}
                    placeholder="1 25544U 98067A   23244.20459586  .00014761  00000-0  26305-3 0  9997"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block mb-1">TLE Line 2</label>
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
              <div className={`p-3 rounded text-xs ${tleValidationResult.isValid ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' : 'bg-rose-950/40 border border-rose-500/20 text-rose-400'}`}>
                <p className="font-semibold mb-1">TLE Validation: {tleValidationResult.isValid ? 'Valid' : 'Invalid'}</p>
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
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded"
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
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2 rounded"
              >
                {isSubmitting ? 'Adding...' : 'Save Object'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TLE Paste Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleImportTLE} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100">Import TLE Dataset</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200 text-xl font-bold"
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
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Paste TLE Text (Multi-satellite supported)</label>
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
              <div className="space-y-2 text-xs bg-slate-950 p-4 border border-slate-800 rounded">
                <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-2">Import Summary</p>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-medium">
                  <p>Imported: <span className="text-emerald-400">{importResult.imported}</span></p>
                  <p>Skipped/Failed: <span className="text-rose-400">{importResult.skipped}</span></p>
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
                  <div className="pt-2 border-t border-slate-800/60">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-slate-100">Orbit Trajectory Preview: {previewObject.name}</h2>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-200 text-xl font-bold"
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
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded border border-slate-800 text-xs">
              <div className="flex flex-col">
                <label className="text-slate-400 font-medium mb-1">Propagation Duration (minutes)</label>
                <input
                  type="number"
                  value={propDuration}
                  onChange={e => setPropDuration(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-slate-400 font-medium mb-1">Step Interval (minutes)</label>
                <input
                  type="number"
                  value={propInterval}
                  onChange={e => setPropInterval(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handlePreviewTrajectory(previewObject)}
                  disabled={isPreviewLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 px-3 py-1 rounded text-xs font-semibold"
                >
                  {isPreviewLoading ? 'Propagating...' : 'Recalculate'}
                </button>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-950/45 border border-amber-500/20 rounded p-3 text-xs text-amber-300">
              <p className="font-semibold uppercase tracking-wider mb-1">⚠️ Warning: Non-Scientific Placeholder</p>
              <p>This orbit trajectory is generated using a simple geometric model based solely on current altitude and velocity. It is NOT scientifically accurate and serves as a placeholder until SGP4 or Keplerian propagation engines are integrated.</p>
            </div>

            {/* Results */}
            {previewError && <p className="text-xs text-rose-400" role="alert">{previewError}</p>}
            
            {isPreviewLoading && <p className="text-xs text-slate-400 italic">Calculating orbit path...</p>}

            {propagationData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                  <p>Propagation Status: <span className="font-semibold text-amber-400">{propagationData.supported ? 'Scientific' : 'Placeholder (Non-Scientific)'}</span></p>
                  <p>Propagation Source: <span className="font-semibold text-indigo-400">{propagationData.source || 'Placeholder Engine'}</span></p>
                  <p>Duration: <span className="font-semibold text-slate-100">{propDuration} minutes</span></p>
                  <p>Step Interval: <span className="font-semibold text-slate-100">{propInterval} minutes</span></p>
                </div>
                
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-950 p-2 border-b border-slate-800 text-xs font-bold text-slate-400 flex justify-between">
                    <span>Generated Trajectory Points ({propagationData.placeholderTrajectory?.length || 0})</span>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-800 font-mono text-[11px] bg-slate-950/50">
                    {propagationData.placeholderTrajectory && propagationData.placeholderTrajectory.map((point, idx) => (
                      <div key={idx} className="p-2 flex justify-between text-slate-300 hover:bg-slate-900/50">
                        <span>{new Date(point.timestamp).toLocaleTimeString()} (+{point.timeOffsetMinutes}m)</span>
                        <span>Lat: {point.latitude}° | Lon: {point.longitude}°</span>
                        <span>{point.altitudeKm} km | {point.velocityKmPerSec} km/s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded"
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
    </main>
  );
}
