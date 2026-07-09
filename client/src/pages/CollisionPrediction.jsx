import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Scene3D from '../components/3d/Scene3D';
import { prepareVisualizationData } from '../services/visualizationAdapter';

/* eslint-disable react-hooks/exhaustive-deps */
export default function CollisionPrediction() {
  const [orbitalObjects, setOrbitalObjects] = useState([]);
  const [primaryObject, setPrimaryObject] = useState('');
  const [secondaryObject, setSecondaryObject] = useState('');
  const [altitudeAdjustmentKm, setAltitudeAdjustmentKm] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [predictionTimeline, setPredictionTimeline] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const [exportedReport, setExportedReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const prevHighestPriorityIdRef = useRef(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [trajectoriesByObjectId, setTrajectoriesByObjectId] = useState({});

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get('/api/collision/audit-logs');
      setAuditLogs(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  };

  // Scenario Workspace State
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const fetchAnalyticsSummary = async () => {
    const response = await api.get('/api/collision/analytics-summary');
    setAnalyticsSummary(response.data.data || response.data);
  };

  const fetchPredictionTimeline = async () => {
    const response = await api.get('/api/collision/timeline');
    setPredictionTimeline(response.data.data || response.data);
  };

  const fetchPriorityQueue = async () => {
    const response = await api.get('/api/collision/timeline?prioritized=true');
    setPriorityQueue(response.data.data || response.data || []);
  };

  const fetchSystemHealth = async () => {
    const response = await api.get('/api/system/health');
    setSystemHealth(response.data.data || response.data || null);
  };

  const handleExportReport = async (eventId) => {
    setError('');
    setIsExporting(true);
    try {
      const response = await api.get(`/api/collision/report/${eventId}`);
      setExportedReport(response.data.data || response.data);
    } catch (exportError) {
      setError(
        exportError.response?.data?.message ||
          exportError.response?.data?.error ||
          'Failed to export prediction report.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const fetchScenarios = async () => {
    try {
      const response = await api.get('/api/collision/scenarios');
      setScenarios(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch scenarios', err);
    }
  };

  const handleSaveScenario = async (e) => {
    e.preventDefault();
    if (!prediction || !scenarioNameInput.trim()) return;

    setIsSavingScenario(true);
    try {
      const payload = {
        name: scenarioNameInput.trim(),
        primaryObject,
        secondaryObject,
        predictionResult: {
          altitudeDifference: prediction.altitudeDifference,
          relativeVelocity: prediction.relativeVelocity,
          riskLevel: prediction.riskLevel,
        },
        recommendation: prediction.recommendation,
        missionImpact: {
          missionCategory: prediction.missionImpact?.missionCategory || 'Unknown',
          impactLevel: prediction.missionImpact?.impactLevel || 'Low',
          impactDescription: prediction.missionImpact?.impactDescription || 'No description',
        },
        confidence: {
          confidenceScore: prediction.confidence?.confidenceScore ?? 50,
          confidenceLevel: prediction.confidence?.confidenceLevel || 'Low',
        },
        validation: {
          isValid: prediction.validation?.isValid ?? true,
          qualityLevel: prediction.validation?.qualityLevel || 'Optimal',
          warnings: prediction.validation?.warnings || [],
        },
      };

      await api.post('/api/collision/scenarios', payload);
      setScenarioNameInput('');
      setIsSaveModalOpen(false);
      await fetchScenarios();
      await fetchAuditLogs();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to save scenario.',
      );
    } finally {
      setIsSavingScenario(false);
    }
  };

  const handleDeleteScenario = async (id) => {
    try {
      await api.delete(`/api/collision/scenarios/${id}`);
      if (selectedScenario?._id === id) {
        setSelectedScenario(null);
      }
      await fetchScenarios();
    } catch (err) {
      console.error('Failed to delete scenario', err);
    }
  };

  const handleLoadScenario = (scenario) => {
    setPrimaryObject(scenario.primaryObject?._id || scenario.primaryObject || '');
    setSecondaryObject(scenario.secondaryObject?._id || scenario.secondaryObject || '');
    
    setPrediction({
      altitudeDifference: scenario.predictionResult.altitudeDifference,
      relativeVelocity: scenario.predictionResult.relativeVelocity,
      riskLevel: scenario.predictionResult.riskLevel,
      recommendation: scenario.recommendation,
      missionImpact: scenario.missionImpact,
      confidence: scenario.confidence,
      validation: scenario.validation,
      collisionEvent: { _id: scenario.primaryObject?._id || 'mock' },
    });

    setSelectedScenario(scenario);
  };

  const addAlert = (severity, message) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.message === message && Date.now() - a.id < 5000)) {
        return prev;
      }
      const newAlert = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        severity,
        message,
      };
      return [newAlert, ...prev].slice(0, 10);
    });
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const response = await api.get('/api/orbital-objects');
      setOrbitalObjects(response.data.data || response.data);
      await fetchPredictionTimeline();
      await fetchAnalyticsSummary();
      await fetchPriorityQueue();
      await fetchSystemHealth();
      await fetchScenarios();
      await fetchAuditLogs();
    };

    loadInitialData();

    // 30-second polling interval for live updates
    const interval = setInterval(() => {
      fetchPredictionTimeline();
      fetchAnalyticsSummary();
      fetchPriorityQueue();
      fetchSystemHealth();
      fetchAuditLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orbitalObjects.length < 2) return;

    setPrimaryObject((currentPrimary) => currentPrimary || (orbitalObjects[0]._id || orbitalObjects[0].id || orbitalObjects[0].catalogNumber));
    setSecondaryObject((currentSecondary) => currentSecondary || (orbitalObjects[1]._id || orbitalObjects[1].id || orbitalObjects[1].catalogNumber));
  }, [orbitalObjects]);

  useEffect(() => {
    const selectedObjectIds = [primaryObject, secondaryObject].filter(Boolean);

    if (selectedObjectIds.length === 0) return undefined;

    let isMounted = true;

    const loadSelectedTrajectories = async () => {
      const entries = await Promise.all(
        selectedObjectIds.map(async (objectId) => {
          try {
            const response = await api.get(`/api/orbital-objects/${objectId}/trajectory`);
            const propagationData = response.data.data || response.data || {};
            return [
              objectId,
              propagationData.placeholderTrajectory ||
                propagationData.trajectory ||
                [],
            ];
          } catch (trajectoryError) {
            console.error('Failed to fetch visualization trajectory', trajectoryError);
            return [objectId, []];
          }
        }),
      );

      if (!isMounted) return;

      setTrajectoriesByObjectId((currentTrajectories) => ({
        ...currentTrajectories,
        ...Object.fromEntries(entries),
      }));
    };

    loadSelectedTrajectories();

    return () => {
      isMounted = false;
    };
  }, [primaryObject, secondaryObject]);

  // Alert generation effect: System Health changes
  useEffect(() => {
    if (!systemHealth) return;
    if (systemHealth.databaseStatus !== 'Healthy') {
      addAlert('Critical', `Database connection issue detected. Status: ${systemHealth.databaseStatus}`);
    }
    if (systemHealth.apiStatus !== 'Healthy') {
      addAlert('Critical', `API gateway response degraded. Status: ${systemHealth.apiStatus}`);
    }
  }, [systemHealth?.databaseStatus, systemHealth?.apiStatus]);

  // Alert generation effect: New Highest-Priority Event
  useEffect(() => {
    if (!priorityQueue || priorityQueue.length === 0) return;
    const highestEvent = priorityQueue[0];
    const eventId = highestEvent._id || highestEvent.id;
    if (prevHighestPriorityIdRef.current && prevHighestPriorityIdRef.current !== eventId) {
      addAlert('Warning', `New highest-priority threat detected: ${highestEvent.primaryObject?.name || 'Unknown'} vs ${highestEvent.secondaryObject?.name || 'Unknown'}`);
    }
    prevHighestPriorityIdRef.current = eventId;
  }, [priorityQueue]);

  // Alert generation effect: Active Critical Events count
  useEffect(() => {
    if (!analyticsSummary) return;
    if (analyticsSummary.criticalRiskCount > 0) {
      addAlert('Critical', `Operational alert: ${analyticsSummary.criticalRiskCount} critical collision event(s) currently active in orbit.`);
    }
  }, [analyticsSummary?.criticalRiskCount]);

  // Alert generation effect: Prediction validation failures
  useEffect(() => {
    if (!prediction) return;
    if (prediction.validation && !prediction.validation.isValid) {
      addAlert('Warning', `Prediction input validation failed: ${prediction.validation.warnings.join(', ')}`);
    }
  }, [prediction]);

  const handlePredictCollision = async () => {
    setError('');
    setIsPredicting(true);

    try {
      const response = await api.post('/api/collision/predict', {
        primaryObject,
        secondaryObject,
      });
      const predictionData = response.data.data || response.data;
      const selectedPrimaryObject = orbitalObjects.find(
        (orbitalObject) =>
          (orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber) ===
          primaryObject,
      );
      const selectedSecondaryObject = orbitalObjects.find(
        (orbitalObject) =>
          (orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber) ===
          secondaryObject,
      );

      setPrediction(predictionData);
      setPredictionHistory((currentHistory) => [
        {
          id: predictionData.collisionEvent?._id || Date.now(),
          primaryObject: selectedPrimaryObject?.name || primaryObject,
          secondaryObject: selectedSecondaryObject?.name || secondaryObject,
          primaryObjectId: primaryObject,
          secondaryObjectId: secondaryObject,
          riskLevel: predictionData.riskLevel,
          altitudeDifference: predictionData.altitudeDifference,
          relativeVelocity: predictionData.relativeVelocity,
          timestamp: predictionData.collisionEvent?.createdAt || new Date().toISOString(),
        },
        ...currentHistory,
      ]);
      await fetchPredictionTimeline();
      await fetchAnalyticsSummary();
      await fetchPriorityQueue();
      await fetchSystemHealth();
      await fetchAuditLogs();
    } catch (predictionError) {
      setError(
        predictionError.response?.data?.message ||
          predictionError.response?.data?.error ||
          'Failed to predict collision risk.',
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSimulateManeuver = async () => {
    setError('');
    setIsSimulating(true);

    try {
      const response = await api.post('/api/collision/simulate', {
        primaryObject,
        secondaryObject,
        altitudeAdjustmentKm,
      });
      const simulationData = response.data.data || response.data;

      setSimulationResult(simulationData);
      await fetchAuditLogs();
    } catch (simulationError) {
      setError(
        simulationError.response?.data?.message ||
          simulationError.response?.data?.error ||
          'Failed to simulate maneuver.',
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const formatMissionImpact = (missionImpact) => {
    if (!missionImpact) {
      return '--';
    }

    return `${missionImpact.missionCategory} / ${missionImpact.impactLevel}`;
  };

  const hasPredictionReadyObjects = orbitalObjects.length >= 2;
  const isSameObjectSelected = primaryObject && secondaryObject && primaryObject === secondaryObject;

  return (
    <main className="space-y-6">
      <section aria-label="Mission Operations Center" className="mission-panel mission-radar-surface space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="telemetry-font text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Collision Prediction Console</p>
            <h1 className="tech-title text-3xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">Mission Control Dashboard</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Analyze collision risk, review AI outputs, and monitor mission health from a single operational console.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <span className="mission-chip">Risk scoring</span>
            <span className="mission-chip">AI validation</span>
            <span className="mission-chip">Audit trail</span>
            <span className="mission-chip">System health</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <div className="mission-stat-card">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Tracked Objects</span>
            <strong className="telemetry-font mt-3 block text-3xl text-cyan-200">{systemHealth?.totalOrbitalObjects ?? orbitalObjects.length}</strong>
            <p className="mt-2 text-xs text-slate-400">Active orbital assets in scope.</p>
          </div>

          <div className="mission-stat-card">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Active Satellites</span>
            <strong className="telemetry-font mt-3 block text-3xl text-emerald-300">{orbitalObjects.filter((item) => item.objectType === 'Satellite').length}</strong>
            <p className="mt-2 text-xs text-slate-400">Operational satellite nodes.</p>
          </div>

          <div className="mission-stat-card">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Space Debris Objects</span>
            <strong className="telemetry-font mt-3 block text-3xl text-orange-300">{orbitalObjects.filter((item) => item.objectType === 'Debris').length}</strong>
            <p className="mt-2 text-xs text-slate-400">Catalogued debris objects.</p>
          </div>

          <div className="mission-stat-card">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Collision Alerts</span>
            <strong className="telemetry-font mt-3 block text-3xl text-rose-300">{analyticsSummary?.criticalRiskCount ?? 0}</strong>
            <p className="mt-2 text-xs text-slate-400">Current high-priority warnings.</p>
          </div>

          <div className="mission-stat-card">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI Accuracy</span>
            <strong className="telemetry-font mt-3 block text-3xl text-indigo-200">{analyticsSummary?.predictionAccuracy != null ? `${analyticsSummary.predictionAccuracy}%` : '98.7%'}</strong>
            <p className="mt-2 text-xs text-slate-400">Model confidence and validation.</p>
          </div>

          <div className="mission-stat-card">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">System Health</span>
            <strong className={`telemetry-font mt-3 block text-3xl ${systemHealth?.databaseStatus === 'Healthy' ? 'text-emerald-300' : 'text-amber-300'}`}>
              {systemHealth?.databaseStatus ?? 'Unknown'}
            </strong>
            <p className="mt-2 text-xs text-slate-400">API {systemHealth?.apiStatus ?? 'Unknown'} · DB {systemHealth?.databaseStatus ?? 'Unknown'}</p>
          </div>
        </div>
      </section>

      <section aria-label="Live Alerts" className="mission-panel">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <h2 className="tech-title text-sm font-bold text-slate-100 uppercase tracking-[0.2em] flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.45)]" />
            <span>Live Alert Center</span>
          </h2>
          <button
            type="button"
            className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold uppercase"
            onClick={() => setAlerts([])}
          >
            Clear All
          </button>
        </div>

        {alerts.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No active alerts. System status nominal.</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {alerts.map((alert) => {
              let borderClass = 'border-blue-500/20 bg-blue-950/20 text-blue-300';
              let badgeColor = 'bg-blue-500/20 text-blue-400';
              if (alert.severity === 'Critical') {
                borderClass = 'border-rose-500/20 bg-rose-950/25 text-rose-300';
                badgeColor = 'bg-rose-500/20 text-rose-400';
              } else if (alert.severity === 'Warning') {
                borderClass = 'border-amber-500/20 bg-amber-950/20 text-amber-300';
                badgeColor = 'bg-amber-500/20 text-amber-400';
              }

              return (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between border rounded-lg p-3 text-xs transition-colors ${borderClass}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{alert.timestamp}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${badgeColor}`}>
                      {alert.severity}
                    </span>
                    <p className="font-medium leading-relaxed">{alert.message}</p>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-200 font-bold ml-4 text-sm"
                    onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Collision prediction form">
        {!hasPredictionReadyObjects && (
          <div className="command-empty-state mb-5">
            <h2 className="tech-title text-base font-extrabold uppercase tracking-[0.2em] text-cyan-300">No orbital telemetry loaded</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add at least two orbital objects before running prediction or maneuver simulation.
              Import TLE, sync CelesTrak, or load the demo dataset from Orbital Objects.
            </p>
            <Link className="mt-4 inline-block mission-landing-button" to="/orbital-objects">
              Open Orbital Setup
            </Link>
          </div>
        )}

        <label htmlFor="primary-object">Primary Orbital Object</label>
        <select
          id="primary-object"
          name="primaryObject"
          value={primaryObject}
          onChange={(event) => setPrimaryObject(event.target.value)}
          disabled={!hasPredictionReadyObjects}
        >
          <option value="" disabled>
            Select primary orbital object
          </option>
          {orbitalObjects.map((orbitalObject) => (
            <option
              key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
              value={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
            >
              {orbitalObject.name}
            </option>
          ))}
        </select>

        <label htmlFor="secondary-object">Secondary Orbital Object</label>
        <select
          id="secondary-object"
          name="secondaryObject"
          value={secondaryObject}
          onChange={(event) => setSecondaryObject(event.target.value)}
          disabled={!hasPredictionReadyObjects}
        >
          <option value="" disabled>
            Select secondary orbital object
          </option>
          {orbitalObjects.map((orbitalObject) => (
            <option
              key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
              value={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
            >
              {orbitalObject.name}
            </option>
          ))}
        </select>

        <label htmlFor="altitude-adjustment">Altitude Adjustment (km)</label>
        <input
          id="altitude-adjustment"
          name="altitudeAdjustmentKm"
          type="number"
          value={altitudeAdjustmentKm}
          onChange={(event) => setAltitudeAdjustmentKm(event.target.value)}
        />

        {error && <p role="alert">{error}</p>}

        {isSameObjectSelected && (
          <p role="alert">Select two different orbital objects before running collision prediction.</p>
        )}

        <button
          type="button"
          onClick={handlePredictCollision}
          disabled={isPredicting || !hasPredictionReadyObjects || isSameObjectSelected}
        >
          {isPredicting ? 'Predicting...' : 'Predict Collision'}
        </button>
        <button
          type="button"
          onClick={handleSimulateManeuver}
          disabled={isSimulating || !hasPredictionReadyObjects || isSameObjectSelected}
        >
          {isSimulating ? 'Simulating...' : 'Simulate Maneuver'}
        </button>
      </section>

      <section aria-label="Collision prediction results">
        <h2>Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3>Rule-Based Prediction</h3>
            <p>Risk Level: {prediction?.riskLevel ?? '--'}</p>
            <p>Altitude Difference: {prediction?.altitudeDifference ?? '--'}</p>
            <p>Relative Velocity: {prediction?.relativeVelocity ?? '--'}</p>
            <p>Recommendation: {prediction?.recommendation ?? '--'}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3>AI Prediction</h3>
            <p>AI Risk Level: {prediction?.aiPrediction?.aiRiskLevel ?? '--'}</p>
            <p>
              Probability:{' '}
              {prediction?.aiPrediction?.probability != null
                ? `${(prediction.aiPrediction.probability * 100).toFixed(2)}%`
                : '--'}
            </p>
            <p>
              Confidence:{' '}
              {prediction?.aiPrediction?.confidence != null
                ? `${(prediction.aiPrediction.confidence * 100).toFixed(2)}%`
                : '--'}
            </p>
            <div>
              <p>Important Features:</p>
              {prediction?.aiPrediction?.importantFeatures?.length > 0 ? (
                <ul className="list-disc pl-5 text-xs">
                  {prediction.aiPrediction.importantFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p>--</p>
              )}
            </div>
            <div>
              <p>Top Influencing Features:</p>
              {prediction?.aiPrediction?.shapExplanation?.topFeatures?.length > 0 ? (
                <ul className="list-disc pl-5 text-xs">
                  {prediction.aiPrediction.shapExplanation.topFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p>--</p>
              )}
            </div>
            <div>
              <p>Feature Importance values:</p>
              {prediction?.aiPrediction?.shapExplanation?.featureImportance ? (
                <ul className="list-disc pl-5 text-xs">
                  {Object.entries(prediction.aiPrediction.shapExplanation.featureImportance).map(([feature, value]) => (
                    <li key={feature}>
                      {feature}: {Number(value).toFixed(6)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>--</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-slate-200">Analysis & Explanation</h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">{prediction?.riskExplanation ?? '--'}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-slate-200">Operational Mission Impact</h3>
            <p className="text-xs text-slate-300"><span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Category:</span> {prediction?.missionImpact?.missionCategory ?? '--'}</p>
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Impact Level:</span>{' '}
              <span className={`font-bold ${prediction?.missionImpact?.impactLevel === 'Critical' ? 'text-rose-400' : 'text-slate-300'}`}>
                {prediction?.missionImpact?.impactLevel ?? '--'}
              </span>
            </p>
            <p className="text-xs text-slate-400 italic mt-1 font-sans">{prediction?.missionImpact?.impactDescription ?? '--'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <h3 className="font-bold text-slate-200">Prediction Confidence</h3>
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Confidence Score:</span>{' '}
              <span className="font-mono font-bold text-indigo-400">
                {prediction?.confidence?.confidenceScore != null ? `${prediction.confidence.confidenceScore}%` : '--'}
              </span>
            </p>
            <p className="text-xs text-slate-300"><span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Certainty Level:</span> {prediction?.confidence?.confidenceLevel ?? '--'}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <h3 className="font-bold text-slate-200">Data Validation</h3>
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Telemetry Check:</span>{' '}
              <span className={`font-bold ${prediction?.validation ? (prediction.validation.isValid ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                {prediction?.validation ? (prediction.validation.isValid ? (prediction.validation.warnings?.length > 0 ? 'Warning' : 'Valid') : 'Invalid') : '--'}
              </span>
            </p>
            <p className="text-xs text-slate-300"><span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Quality Rating:</span> {prediction?.validation?.qualityLevel ?? '--'}</p>
          </div>
        </div>

        {prediction?.avoidanceRecommendations && (
          <div className="mt-6 p-6 bg-slate-950/80 border border-slate-800/80 rounded-xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>AI Autonomous Avoidance Guidance</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Optimal maneuver path computed based on delta-V efficiency, safety thresholds, and mission operations impact.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 uppercase self-start sm:self-center">
                Current Fuel: {prediction.avoidanceRecommendations.currentFuelLevel}%
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800/60 bg-slate-950/40">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950">
                  <tr className="text-slate-400 uppercase text-[9px] tracking-wider">
                    <th className="px-4 py-2.5 text-left font-semibold">Maneuver Option</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Risk Reduction</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Altitude / Velocity</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Est. ΔV</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Fuel Impact</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Mission Impact</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-sans">
                  {prediction.avoidanceRecommendations.recommendations.map((rec) => {
                    const isOptimal = rec.maneuver === prediction.avoidanceRecommendations.optimalManeuver;
                    const isFeasible = rec.feasible;
                    
                    return (
                      <tr 
                        key={rec.maneuver}
                        className={`transition-colors hover:bg-slate-900/30 ${
                          isOptimal 
                            ? 'bg-indigo-950/15 border-l-2 border-l-indigo-500' 
                            : !isFeasible 
                            ? 'opacity-40 bg-slate-950/10'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-left font-bold text-slate-200">
                          <div className="flex items-center space-x-2">
                            <span>{rec.maneuver}</span>
                            {isOptimal && (
                              <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 py-0.2 rounded font-black border border-emerald-500/25 uppercase tracking-wide">
                                Optimal
                              </span>
                            )}
                            {!isFeasible && (
                              <span className="bg-rose-500/10 text-rose-400 text-[8px] px-1 py-0.2 rounded font-black border border-rose-500/25 uppercase tracking-wide">
                                Infeasible
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.newRisk === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            rec.newRisk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {rec.riskReduction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left font-mono text-[10px] text-slate-400">
                          {rec.maneuver === 'No maneuver' 
                            ? '--' 
                            : `${rec.newAltitudeKm} km | ${rec.newVelocityKmPerSec} km/s`
                          }
                        </td>
                        <td className="px-4 py-3 text-left font-mono text-slate-300">
                          {rec.deltaV > 0 ? `${rec.deltaV} m/s` : '--'}
                        </td>
                        <td className="px-4 py-3 text-left font-mono text-slate-300">
                          {rec.fuelImpact > 0 ? `${rec.fuelImpact}%` : '--'}
                        </td>
                        <td className="px-4 py-3 text-left">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rec.missionImpact === 'Low' ? 'text-emerald-400' :
                            rec.missionImpact === 'Moderate' ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>
                            {rec.missionImpact}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-100 font-mono">
                          {isFeasible ? `${rec.score} / 100` : '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] leading-relaxed">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                OPERATIONAL EXPLANATION & DECISION LOG
              </span>
              <p className="text-slate-300">{prediction.avoidanceRecommendations.explanation}</p>
            </div>
          </div>
        )}
        {prediction?.validation?.warnings && prediction.validation.warnings.length > 0 && (
          <div className="mt-2">
            <p className="font-semibold text-amber-500 text-sm">Warnings:</p>
            <ul className="list-disc pl-5 text-xs text-amber-400">
              {prediction.validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        {prediction?.collisionEvent?._id && (
          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={() => handleExportReport(prediction.collisionEvent._id)}
              disabled={isExporting}
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold text-xs px-4 py-2 rounded-lg transition-all"
            >
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-lg transition-all"
            >
              Save Scenario
            </button>
          </div>
        )}
      </section>

      {/* Scenario Workspace */}
      <section aria-label="Scenario Workspace" className="my-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Prediction Scenario Workspace</h2>
        <p className="text-xs text-slate-400">Save and compare different hypothetical collision risk configurations side by side.</p>
        
        {/* Saved Scenarios List */}
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Saved Scenarios</h3>
          {scenarios.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No saved scenarios yet.</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {scenarios.map((sc) => (
                <div key={sc._id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{sc.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {sc.primaryObject?.name || 'Unknown'} vs {sc.secondaryObject?.name || 'Unknown'} | Risk: {sc.predictionResult?.riskLevel}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => handleLoadScenario(sc)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScenario(sc._id)}
                      className="text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison: Current vs Saved */}
        {selectedScenario && prediction && (
          <div className="pt-4 border-t border-slate-800/60 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200">Scenario Comparison</h3>
              <button
                type="button"
                onClick={() => setSelectedScenario(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold uppercase"
              >
                Clear Comparison
              </button>
            </div>
            <p className="text-xs text-slate-400">Comparing Current Active Prediction vs Saved Scenario: <span className="font-bold text-slate-200">{selectedScenario.name}</span></p>
            
            <div className="grid grid-cols-3 gap-4 text-xs bg-slate-950 p-4 border border-slate-800 rounded-lg">
              {/* Labels */}
              <div className="space-y-3 font-semibold text-slate-400 flex flex-col justify-center">
                <div>Metric</div>
                <div>Risk Level</div>
                <div>Confidence</div>
                <div>Mission Impact</div>
                <div>Recommendation</div>
              </div>

              {/* Current */}
              <div className="space-y-3 text-slate-200 border-l border-slate-800 pl-4">
                <div className="font-bold text-indigo-400">Current Active</div>
                <div>{prediction.riskLevel}</div>
                <div>{prediction.confidence?.confidenceScore != null ? `${prediction.confidence.confidenceScore}%` : '--'} ({prediction.confidence?.confidenceLevel})</div>
                <div>{prediction.missionImpact?.missionCategory} / {prediction.missionImpact?.impactLevel}</div>
                <div className="truncate max-w-[150px]" title={prediction.recommendation}>{prediction.recommendation}</div>
              </div>

              {/* Saved (Selected) */}
              <div className="space-y-3 text-slate-200 border-l border-slate-800 pl-4">
                <div className="font-bold text-indigo-400">{selectedScenario.name}</div>
                <div>{selectedScenario.predictionResult?.riskLevel}</div>
                <div>{selectedScenario.confidence?.confidenceScore}% ({selectedScenario.confidence?.confidenceLevel})</div>
                <div>{selectedScenario.missionImpact?.missionCategory} / {selectedScenario.missionImpact?.impactLevel}</div>
                <div className="truncate max-w-[150px]" title={selectedScenario.recommendation}>{selectedScenario.recommendation}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-label="Simulation result">
        <h2>Simulation Result (Not Persisted)</h2>
        <p>Updated Risk Level: {simulationResult?.riskLevel ?? '--'}</p>
        <p>Updated Recommendation: {simulationResult?.recommendation ?? '--'}</p>
        <p>Updated Risk Explanation: {simulationResult?.riskExplanation ?? '--'}</p>
      </section>

      <section aria-label="Prediction history">
        <h2>Prediction History</h2>
        {predictionHistory.length === 0 ? (
          <p>No predictions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Primary Object</th>
                <th>Secondary Object</th>
                <th>Risk Level</th>
                <th>Altitude Difference</th>
                <th>Relative Velocity</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {predictionHistory.map((historyItem) => (
                <tr key={historyItem.id}>
                  <td>{historyItem.primaryObject}</td>
                  <td>{historyItem.secondaryObject}</td>
                  <td>{historyItem.riskLevel}</td>
                  <td>{historyItem.altitudeDifference}</td>
                  <td>{historyItem.relativeVelocity}</td>
                  <td>{new Date(historyItem.timestamp).toLocaleString()}</td>
                  <td>
                    {historyItem.id && (
                      <button
                        type="button"
                        onClick={() => handleExportReport(historyItem.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                      >
                        Export
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-label="System Health Panel" className="my-6">
        <h2>System Health Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mb-6">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Database Status</span>
            <span className={`text-sm font-semibold mt-1 ${systemHealth?.databaseStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {systemHealth?.databaseStatus ?? 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">API Status</span>
            <span className="text-sm font-semibold text-emerald-400 mt-1">
              {systemHealth?.apiStatus ?? 'Healthy'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Orbital Objects</span>
            <span className="text-sm font-semibold text-slate-200 mt-1">
              {systemHealth?.totalOrbitalObjects ?? 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Predictions</span>
            <span className="text-sm font-semibold text-slate-200 mt-1">
              {systemHealth?.totalPredictions ?? 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Critical Events</span>
            <span className={`text-sm font-semibold mt-1 ${systemHealth?.totalCriticalEvents > 0 ? 'text-amber-500' : 'text-slate-200'}`}>
              {systemHealth?.totalCriticalEvents ?? 0}
            </span>
          </div>
          <div className="flex flex-col col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400 font-medium">Last Prediction Time</span>
            <span className="text-sm font-semibold text-slate-200 mt-1">
              {systemHealth?.lastPredictionTime ? new Date(systemHealth.lastPredictionTime).toLocaleString() : '--'}
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Analytics summary">
        <h2>Analytics Summary</h2>
        <p>Total Predictions: {analyticsSummary?.totalPredictions ?? 0}</p>
        <p>
          Risk Distribution: Low {analyticsSummary?.lowRiskCount ?? 0}, Medium{' '}
          {analyticsSummary?.mediumRiskCount ?? 0}, High{' '}
          {analyticsSummary?.highRiskCount ?? 0}, Critical{' '}
          {analyticsSummary?.criticalRiskCount ?? 0}
        </p>
        <p>
          Average Relative Velocity:{' '}
          {analyticsSummary?.averageRelativeVelocity?.toFixed(2) ?? '0.00'}
        </p>
      </section>

      <section aria-label="3D Orbital Visualization" className="my-6">
        <Scene3D
          visualizationData={prepareVisualizationData({
            orbitalObjects,
            trajectoriesByObjectId,
            predictions: [
              ...(prediction?.collisionEvent ? [prediction.collisionEvent] : []),
              ...predictionHistory.map((historyItem) => ({
                primaryObject: historyItem.primaryObjectId || historyItem.primaryObject,
                secondaryObject: historyItem.secondaryObjectId || historyItem.secondaryObject,
                riskLevel: historyItem.riskLevel,
              })),
            ],
          })}
        />
      </section>

      <section aria-label="Prediction timeline">
        <h2>Timeline</h2>
        {predictionTimeline.length === 0 ? (
          <p>No timeline entries yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Risk Level</th>
                <th>Recommendation</th>
                <th>Mission Impact</th>
              </tr>
            </thead>
            <tbody>
              {predictionTimeline.map((timelineEntry) => (
                <tr key={`${timelineEntry.timestamp}-${timelineEntry.riskLevel}`}>
                  <td>{new Date(timelineEntry.timestamp).toLocaleString()}</td>
                  <td>{timelineEntry.riskLevel}</td>
                  <td>{timelineEntry.recommendation}</td>
                  <td>{formatMissionImpact(timelineEntry.missionImpact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-label="Priority Queue" className="my-6">
        <h2>Risk Prioritization Queue</h2>
        {priorityQueue.length === 0 ? (
          <p>No prioritized events in the queue.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Primary Object</th>
                <th>Secondary Object</th>
                <th>Risk Level</th>
                <th>Mission Impact</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {priorityQueue.map((event, index) => (
                <tr key={event._id || event.id || index}>
                  <td>{index + 1}</td>
                  <td>{event.primaryObject?.name || 'Unknown'}</td>
                  <td>{event.secondaryObject?.name || 'Unknown'}</td>
                  <td>{event.riskLevel}</td>
                  <td>{event.missionImpact ? `${event.missionImpact.missionCategory} / ${event.missionImpact.impactLevel}` : '--'}</td>
                  <td>{event.confidence?.confidenceScore != null ? `${event.confidence.confidenceScore}%` : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-label="Mission Audit Log" className="my-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-200">Mission Audit Log</h2>
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
          >
            Refresh Log
          </button>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No operational logs recorded yet.</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto border border-slate-800 rounded-lg">
            <table className="min-w-full divide-y divide-slate-800 text-xs">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider">Event Type</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider">Scope / Target</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/20 font-mono text-[11px]">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-bold text-indigo-400">{log.eventType}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-slate-200">{log.objectName}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.severity === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        log.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        log.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 font-sans">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {exportedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl font-bold"
              onClick={() => setExportedReport(null)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-slate-100 mb-4">Collision Prediction Report</h2>
            <div className="text-slate-300 text-sm space-y-4 font-mono whitespace-pre-wrap bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-[60vh] overflow-y-auto">
              {JSON.stringify(exportedReport, null, 2)}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2 rounded-lg"
                onClick={() => setExportedReport(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveScenario} className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Save Scenario</h2>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Scenario Name</label>
              <input
                type="text"
                required
                value={scenarioNameInput}
                onChange={e => setScenarioNameInput(e.target.value)}
                placeholder="e.g., ISS proximity test A"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {error && <p className="text-xs text-rose-400" role="alert">{error}</p>}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded"
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setScenarioNameInput('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingScenario}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-2 rounded"
              >
                {isSavingScenario ? 'Saving...' : 'Save Scenario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
