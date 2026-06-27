import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Scene3D from '../components/3d/Scene3D';
import { prepareVisualizationData } from '../services/visualizationAdapter';

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
    };

    loadInitialData();

    // 30-second polling interval for live updates
    const interval = setInterval(() => {
      fetchPredictionTimeline();
      fetchAnalyticsSummary();
      fetchPriorityQueue();
      fetchSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <main>
      <h1>Collision Prediction</h1>

      <section aria-label="Mission Operations Center" className="my-6">
        <h2 className="text-lg font-bold text-indigo-300 tracking-wider uppercase border-b border-slate-800 pb-2 mb-4">
          Mission Operations Center
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: System Status */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">System Status</span>
            <div className="mt-2 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-slate-100">OPERATIONAL</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-mono">
              API: {systemHealth?.apiStatus ?? 'Healthy'} | DB: {systemHealth?.databaseStatus ?? 'Healthy'}
            </span>
          </div>

          {/* Card 2: Active Critical Events */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Critical Events</span>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-rose-500">
                {analyticsSummary?.criticalRiskCount ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium">Active</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-mono">
              Total Predictions: {analyticsSummary?.totalPredictions ?? 0}
            </span>
          </div>

          {/* Card 3: Current Highest Priority Event */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Highest Priority Event</span>
            {priorityQueue && priorityQueue.length > 0 ? (
              <div className="mt-2">
                <span className="text-xs font-bold text-rose-400 block truncate">
                  {priorityQueue[0].primaryObject?.name || 'Unknown'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  vs {priorityQueue[0].secondaryObject?.name || 'Unknown'}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium mt-2 block">No events in queue</span>
            )}
            <span className="text-[10px] text-slate-500 mt-2 font-mono uppercase">
              Priority Score: {priorityQueue && priorityQueue.length > 0 ? priorityQueue[0].priorityScore : '--'}
            </span>
          </div>

          {/* Card 4: Last Collision Prediction */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Last Prediction</span>
            {predictionHistory && predictionHistory.length > 0 ? (
              <div className="mt-2">
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {predictionHistory[0].primaryObject}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  vs {predictionHistory[0].secondaryObject}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-medium mt-2 block">None recorded</span>
            )}
            <span className="text-[10px] text-slate-500 mt-2 font-mono uppercase block truncate">
              Risk: {predictionHistory && predictionHistory.length > 0 ? predictionHistory[0].riskLevel : '--'}
            </span>
          </div>

          {/* Card 5: Current Recommendation */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Active Recommendation</span>
            <span className="text-xs font-bold text-indigo-400 mt-2 block line-clamp-2 leading-tight">
              {prediction?.recommendation || (priorityQueue && priorityQueue.length > 0 ? priorityQueue[0].recommendation : 'Continue Monitoring')}
            </span>
            <span className="text-[10px] text-slate-500 mt-2 font-mono uppercase block">
              Status: {prediction?.recommendation ? 'User Session' : 'Prioritized'}
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Live Alerts" className="my-6 bg-slate-950 border border-slate-800 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
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
        <label htmlFor="primary-object">Primary Orbital Object</label>
        <select
          id="primary-object"
          name="primaryObject"
          value={primaryObject}
          onChange={(event) => setPrimaryObject(event.target.value)}
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

        <button type="button" onClick={handlePredictCollision} disabled={isPredicting}>
          {isPredicting ? 'Predicting...' : 'Predict Collision'}
        </button>
        <button type="button" onClick={handleSimulateManeuver} disabled={isSimulating}>
          {isSimulating ? 'Simulating...' : 'Simulate Maneuver'}
        </button>
      </section>

      <section aria-label="Collision prediction results">
        <h2>Results</h2>
        <p>Altitude Difference: {prediction?.altitudeDifference ?? '--'}</p>
        <p>Relative Velocity: {prediction?.relativeVelocity ?? '--'}</p>
        <p>Risk Level: {prediction?.riskLevel ?? '--'}</p>
        <p>Recommendation: {prediction?.recommendation ?? '--'}</p>
        <h3>Why this prediction?</h3>
        <p>{prediction?.riskExplanation ?? '--'}</p>
        <h3>Mission Impact</h3>
        <p>Category: {prediction?.missionImpact?.missionCategory ?? '--'}</p>
        <p>Impact Level: {prediction?.missionImpact?.impactLevel ?? '--'}</p>
        <p>Description: {prediction?.missionImpact?.impactDescription ?? '--'}</p>
        <h3>Prediction Confidence</h3>
        <p>Score: {prediction?.confidence?.confidenceScore != null ? `${prediction.confidence.confidenceScore}%` : '--'}</p>
        <p>Confidence Level: {prediction?.confidence?.confidenceLevel ?? '--'}</p>
        <h3>Prediction Quality</h3>
        <p>Status: {prediction?.validation ? (prediction.validation.isValid ? (prediction.validation.warnings?.length > 0 ? 'Warning' : 'Valid') : 'Invalid') : '--'}</p>
        <p>Quality Level: {prediction?.validation?.qualityLevel ?? '--'}</p>
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
