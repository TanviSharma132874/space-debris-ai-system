import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Scene3D from '../components/3d/Scene3D';
import { prepareVisualizationData } from '../services/visualizationAdapter';
import {
  EmptyState,
  MissionPanel,
  SectionHeader,
  StatusBadge,
  TelemetryValue,
  Timeline,
} from '../components/ui';

const severityForRisk = {
  Critical: 'critical',
  High: 'warning',
  Medium: 'advisory',
  Low: 'normal',
  Normal: 'normal',
  Warning: 'warning',
  Unknown: 'unknown',
};

const formatPercent = (value, digits = 2) => {
  if (value == null || Number.isNaN(Number(value))) return '--';
  const numericValue = Number(value);
  return `${(numericValue <= 1 ? numericValue * 100 : numericValue).toFixed(digits)}%`;
};

const formatNumber = (value, digits = 2) => {
  if (value == null || Number.isNaN(Number(value))) return '--';
  return Number(value).toFixed(digits);
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString();
};

const getObjectLabel = (object) => {
  if (!object) return 'Unassigned';
  if (typeof object === 'string') return object;
  return object.name || object.catalogNumber || object._id || object.id || 'Unknown Object';
};

/* eslint-disable react-hooks/exhaustive-deps */
export default function CollisionPrediction() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');

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

  const [reportsSummary, setReportsSummary] = useState(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');

  const fetchReportsSummary = async () => {
    setIsLoadingReports(true);
    setReportsError('');
    try {
      const response = await api.get('/api/collision/reports/summary');
      setReportsSummary(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch reports summary', err);
      setReportsError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to fetch mission summary report.',
      );
    } finally {
      setIsLoadingReports(false);
    }
  };

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
    if (view === 'reports') {
      fetchReportsSummary();
    }
  }, [view]);

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
  const closestApproachTime =
    prediction?.collisionEvent?.predictedTime ||
    prediction?.collisionEvent?.timeOfClosestApproach ||
    prediction?.predictedTime ||
    prediction?.timeOfClosestApproach;
  const collisionProbability =
    prediction?.collisionEvent?.collisionProbability ??
    prediction?.aiPrediction?.probability ??
    prediction?.collisionProbability;
  const confidenceValue =
    prediction?.confidence?.confidenceScore ??
    prediction?.aiPrediction?.confidence;
  const sourceLabel = prediction?.aiPrediction
    ? 'AI / SGP4'
    : Object.keys(trajectoriesByObjectId).length > 0
      ? 'SGP4'
      : '--';
  const riskSeverity = severityForRisk[prediction?.riskLevel] || 'unknown';
  const topQueueEvent = priorityQueue[0];
  const activeTimelineItems = predictionTimeline.slice(0, 6).map((timelineEntry, index) => ({
    id: `${timelineEntry.timestamp}-${timelineEntry.riskLevel}-${index}`,
    label: timelineEntry.riskLevel || 'Conjunction Event',
    severity: severityForRisk[timelineEntry.riskLevel] || 'unknown',
    timestamp: formatDateTime(timelineEntry.timestamp),
    title: timelineEntry.recommendation || 'Timeline event recorded',
    description: formatMissionImpact(timelineEntry.missionImpact),
  }));
  const auditTimelineItems = auditLogs.slice(0, 8).map((log, index) => ({
    id: `${log.timestamp}-${log.eventType}-${index}`,
    label: log.severity || 'Audit',
    severity: severityForRisk[log.severity] || 'unknown',
    timestamp: formatDateTime(log.timestamp),
    title: log.eventType || 'Operator Event',
    description: `${log.objectName || 'Mission Scope'}: ${log.summary || '--'}`,
  }));
  const checklistItems = [
    { label: 'Objects Selected', complete: Boolean(primaryObject && secondaryObject && !isSameObjectSelected) },
    { label: 'Prediction Executed', complete: Boolean(prediction) },
    { label: 'Validation Reviewed', complete: Boolean(prediction?.validation) },
    { label: 'Maneuver Simulated', complete: Boolean(simulationResult) },
    { label: 'Scenario Saved', complete: Boolean(selectedScenario) },
  ];

  return (
    <main className="space-y-6">
      {view === 'reports' ? (
        <section aria-label="Mission Reports Dashboard" className="mission-panel mission-radar-surface space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="telemetry-font text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Conjunction Summary</p>
              <h1 className="tech-title text-3xl font-black uppercase tracking-[0.2em] text-white sm:text-4xl">Mission Reports Console</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-400">
                Generated at <span className="font-mono text-cyan-200">{reportsSummary ? new Date(reportsSummary.generatedAt).toLocaleString() : '--'}</span>.
              </p>
            </div>
          </div>
          
          {isLoadingReports ? (
            <p className="text-xs text-slate-500 italic">Loading mission reports...</p>
          ) : reportsError ? (
            <p role="alert" className="text-xs text-rose-400 font-semibold">{reportsError}</p>
          ) : reportsSummary ? (
            <>
              {/* Mission Summary Metrics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="mission-stat-card">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Predictions</span>
                  <strong className="telemetry-font mt-3 block text-3xl text-cyan-200">{reportsSummary.missionSummary?.totalPredictions ?? 0}</strong>
                  <p className="mt-2 text-xs text-slate-400">All collision predictions.</p>
                </div>
                <div className="mission-stat-card">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">High Risk Events</span>
                  <strong className="telemetry-font mt-3 block text-3xl text-orange-300">{reportsSummary.missionSummary?.highRiskEvents ?? 0}</strong>
                  <p className="mt-2 text-xs text-slate-400">Current active high risk warnings.</p>
                </div>
                <div className="mission-stat-card">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Critical Events</span>
                  <strong className="telemetry-font mt-3 block text-3xl text-rose-300">{reportsSummary.missionSummary?.criticalEvents ?? 0}</strong>
                  <p className="mt-2 text-xs text-slate-400">Current active critical risk warnings.</p>
                </div>
                <div className="mission-stat-card">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Avg Probability</span>
                  <strong className="telemetry-font mt-3 block text-3xl text-indigo-200">{reportsSummary.missionSummary?.averageCollisionProbability != null ? `${(reportsSummary.missionSummary.averageCollisionProbability * 100).toFixed(4)}%` : '--'}</strong>
                  <p className="mt-2 text-xs text-slate-400">Mean probability score.</p>
                </div>
              </div>

              {/* Risk Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Risk Statistics</h3>
                  <div className="space-y-1 text-xs">
                    <p>Critical: <span className="text-rose-400 font-bold">{reportsSummary.riskAnalytics?.riskDistribution?.Critical ?? 0}</span></p>
                    <p>High: <span className="text-orange-400 font-bold">{reportsSummary.riskAnalytics?.riskDistribution?.High ?? 0}</span></p>
                    <p>Medium: <span className="text-amber-400 font-bold">{reportsSummary.riskAnalytics?.riskDistribution?.Medium ?? 0}</span></p>
                    <p>Low: <span className="text-emerald-400 font-bold">{reportsSummary.riskAnalytics?.riskDistribution?.Low ?? 0}</span></p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60">
                    <p className="text-xs text-slate-400">Average AI Confidence: <span className="font-mono text-indigo-300 font-bold">{reportsSummary.riskAnalytics?.averageAiConfidence != null ? `${(reportsSummary.riskAnalytics.averageAiConfidence * 100).toFixed(2)}%` : '--'}</span></p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Prediction Analytics</h3>
                  <div className="space-y-1 text-xs">
                    <p>Maneuvers Recommended: <span className="text-slate-200 font-semibold">{reportsSummary.avoidanceSummary?.maneuversRecommendedCount ?? 0}</span></p>
                    <p>Monitored Events: <span className="text-slate-200 font-semibold">{reportsSummary.avoidanceSummary?.monitoredEventsCount ?? 0}</span></p>
                    <p>Total Assessments: <span className="text-slate-200 font-semibold">{reportsSummary.riskAssessmentSummary?.totalAssessments ?? 0}</span></p>
                    <p>Latest Recommendation: <span className="text-indigo-400 font-semibold">{reportsSummary.riskAssessmentSummary?.latestRecommendation || 'None'}</span></p>
                  </div>
                </div>
              </div>

              {/* Latest Events List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Conjunction Events Under Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                        <th className="pb-2">Primary Object</th>
                        <th className="pb-2">Secondary Object</th>
                        <th className="pb-2">Approach Time</th>
                        <th className="pb-2">Min Distance (km)</th>
                        <th className="pb-2">Rel Velocity (km/s)</th>
                        <th className="pb-2">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {reportsSummary.latestEvents?.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 font-semibold text-slate-200">{event.primaryObject?.name || 'Unknown'}</td>
                          <td className="py-2.5 font-semibold text-slate-200">{event.secondaryObject?.name || 'Unknown'}</td>
                          <td className="py-2.5 font-mono text-slate-400">{new Date(event.timeOfClosestApproach).toLocaleString()}</td>
                          <td className="py-2.5 font-mono">{event.minimumDistanceKm != null ? `${event.minimumDistanceKm.toFixed(3)} km` : '--'}</td>
                          <td className="py-2.5 font-mono">{event.relativeVelocityKmPerSec != null ? `${event.relativeVelocityKmPerSec.toFixed(3)} km/s` : '--'}</td>
                          <td className="py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              event.riskLevel === 'Low' ? 'text-emerald-400 bg-emerald-950/20' :
                              event.riskLevel === 'Medium' ? 'text-amber-400 bg-amber-950/20' :
                              event.riskLevel === 'High' ? 'text-orange-400 bg-orange-950/20' :
                              'text-rose-400 bg-rose-950/20'
                            }`}>{event.riskLevel}</span>
                          </td>
                        </tr>
                      ))}
                      {(!reportsSummary.latestEvents || reportsSummary.latestEvents.length === 0) && (
                        <tr>
                          <td colSpan="6" className="py-4 text-center text-slate-500 italic">No events found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </section>
      ) : (
        <>
          <MissionPanel aria-label="Conjunction Analysis Console" tone={riskSeverity === 'critical' ? 'critical' : 'active'}>
            <SectionHeader
              kicker="NASA / ISRO Conjunction Analysis"
              title="Conjunction Analysis Console"
              description="Operational workspace for object pairing, risk prediction, maneuver simulation, validation, and event review."
              actions={<StatusBadge severity={riskSeverity}>{prediction?.riskLevel || 'Awaiting Analysis'}</StatusBadge>}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              <div className="mc-panel-inset p-3"><TelemetryValue label="Primary Object" value={selectedPrimaryObject?.name || primaryObject || '--'} /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Secondary Object" value={selectedSecondaryObject?.name || secondaryObject || '--'} /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Risk Level" value={prediction?.riskLevel || '--'} severity={riskSeverity} /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Collision Probability" value={formatPercent(collisionProbability, 4)} /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Closest Approach" value={formatDateTime(closestApproachTime)} /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Relative Velocity" value={formatNumber(prediction?.relativeVelocity, 3)} unit="km/s" /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Confidence" value={formatPercent(confidenceValue, 2)} /></div>
              <div className="mc-panel-inset p-3"><TelemetryValue label="Scientific Source" value={sourceLabel} /></div>
            </div>
          </MissionPanel>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)]">
            <div className="grid gap-4">
              <MissionPanel aria-label="Object selection and commands">
                <SectionHeader kicker="Left Console" title="Object Pairing And Command" />
                {!hasPredictionReadyObjects && (
                  <div className="mc-empty-state mt-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.1em] text-slate-200">No Orbital Telemetry Loaded</p>
                      <p className="mc-body mt-2">Add at least two orbital objects before running prediction or maneuver simulation.</p>
                      <Link className="mc-command-button mt-4" data-variant="primary" to="/orbital-objects">
                        Open Orbital Setup
                      </Link>
                    </div>
                  </div>
                )}
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <label htmlFor="primary-object">Primary Orbital Object</label>
                    <select
                      id="primary-object"
                      name="primaryObject"
                      value={primaryObject}
                      onChange={(event) => setPrimaryObject(event.target.value)}
                      disabled={!hasPredictionReadyObjects}
                    >
                      <option value="" disabled>Select primary orbital object</option>
                      {orbitalObjects.map((orbitalObject) => (
                        <option
                          key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
                          value={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
                        >
                          {orbitalObject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="secondary-object">Secondary Orbital Object</label>
                    <select
                      id="secondary-object"
                      name="secondaryObject"
                      value={secondaryObject}
                      onChange={(event) => setSecondaryObject(event.target.value)}
                      disabled={!hasPredictionReadyObjects}
                    >
                      <option value="" disabled>Select secondary orbital object</option>
                      {orbitalObjects.map((orbitalObject) => (
                        <option
                          key={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
                          value={orbitalObject._id || orbitalObject.id || orbitalObject.catalogNumber}
                        >
                          {orbitalObject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <label htmlFor="altitude-adjustment">Altitude Adjustment (km)</label>
                    <input
                      id="altitude-adjustment"
                      name="altitudeAdjustmentKm"
                      type="number"
                      value={altitudeAdjustmentKm}
                      onChange={(event) => setAltitudeAdjustmentKm(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                  </div>
                </div>
                {error && <p role="alert" className="mt-4">{error}</p>}
                {isSameObjectSelected && (
                  <p role="alert" className="mt-4">Select two different orbital objects before running collision prediction.</p>
                )}
              </MissionPanel>

              <MissionPanel aria-label="Collision prediction results" tone={riskSeverity === 'critical' ? 'critical' : 'default'}>
                <SectionHeader
                  kicker="Analysis Results"
                  title="Operational Prediction Readout"
                  actions={<StatusBadge severity={riskSeverity}>{prediction?.riskLevel || 'No Result'}</StatusBadge>}
                />
                <div className="mt-4 grid gap-3 lg:grid-cols-4">
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Rule Risk" value={prediction?.riskLevel || '--'} severity={riskSeverity} /></div>
                  <div className="mc-panel-inset p-3"><TelemetryValue label="AI Risk" value={prediction?.aiPrediction?.aiRiskLevel || '--'} severity={severityForRisk[prediction?.aiPrediction?.aiRiskLevel] || 'unknown'} /></div>
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Altitude Delta" value={formatNumber(prediction?.altitudeDifference, 3)} unit="km" /></div>
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Relative Velocity" value={formatNumber(prediction?.relativeVelocity, 3)} unit="km/s" /></div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="mc-panel-inset p-4">
                    <p className="mc-kicker">AI Explanation</p>
                    <p className="mc-body mt-2">{prediction?.riskExplanation || '--'}</p>
                    <div className="mt-3 grid gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Top Influencing Features</p>
                      {prediction?.aiPrediction?.shapExplanation?.topFeatures?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {prediction.aiPrediction.shapExplanation.topFeatures.map((feature) => (
                            <span key={feature} className="rounded-md border border-white/[0.08] bg-slate-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                              {feature}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mc-body">--</p>
                      )}
                    </div>
                  </div>
                  <div className="mc-panel-inset p-4">
                    <p className="mc-kicker">Mission Impact</p>
                    <div className="mt-3 grid gap-2">
                      <TelemetryValue label="Category" value={prediction?.missionImpact?.missionCategory || '--'} />
                      <TelemetryValue label="Impact Level" value={prediction?.missionImpact?.impactLevel || '--'} severity={severityForRisk[prediction?.missionImpact?.impactLevel] || 'unknown'} />
                    </div>
                    <p className="mc-body mt-3">{prediction?.missionImpact?.impactDescription || '--'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="mc-panel-inset p-4">
                    <p className="mc-kicker">Validation</p>
                    <div className="mt-3 grid gap-2">
                      <TelemetryValue
                        label="Telemetry Check"
                        value={prediction?.validation ? (prediction.validation.isValid ? (prediction.validation.warnings?.length > 0 ? 'Warning' : 'Valid') : 'Invalid') : '--'}
                        severity={prediction?.validation ? (prediction.validation.isValid ? (prediction.validation.warnings?.length > 0 ? 'warning' : 'normal') : 'critical') : 'unknown'}
                      />
                      <TelemetryValue label="Quality Rating" value={prediction?.validation?.qualityLevel || '--'} />
                    </div>
                    {prediction?.validation?.warnings?.length > 0 && (
                      <ul className="mt-3 grid gap-1 text-xs text-amber-300">
                        {prediction.validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mc-panel-inset p-4">
                    <p className="mc-kicker">Feature Importance</p>
                    {prediction?.aiPrediction?.shapExplanation?.featureImportance ? (
                      <div className="mt-3 grid max-h-36 gap-1 overflow-y-auto pr-1 text-[11px]">
                        {Object.entries(prediction.aiPrediction.shapExplanation.featureImportance).map(([feature, value]) => (
                          <div key={feature} className="flex justify-between gap-3 border-b border-white/[0.05] py-1">
                            <span className="truncate text-slate-400">{feature}</span>
                            <span className="font-mono text-slate-200">{Number(value).toFixed(6)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mc-body mt-2">--</p>
                    )}
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
      </MissionPanel>

      {/* Scenario Workspace */}
      <MissionPanel aria-label="Scenario Workspace">
        <SectionHeader
          kicker="Scenario Workspace"
          title="Prediction Scenario Workspace"
          description="Save and compare different hypothetical collision risk configurations side by side."
        />
        
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
      </MissionPanel>

      <MissionPanel aria-label="Simulation result">
        <SectionHeader kicker="Maneuver Simulation" title="Simulation Result" description="Not persisted until an operator saves or exports the scenario." />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="mc-panel-inset p-3"><TelemetryValue label="Updated Risk" value={simulationResult?.riskLevel || '--'} severity={severityForRisk[simulationResult?.riskLevel] || 'unknown'} /></div>
          <div className="mc-panel-inset p-3 lg:col-span-2"><TelemetryValue label="Updated Recommendation" value={simulationResult?.recommendation || '--'} /></div>
        </div>
        <div className="mc-panel-inset mt-3 p-4">
          <p className="mc-kicker">Risk Explanation</p>
          <p className="mc-body mt-2">{simulationResult?.riskExplanation || '--'}</p>
        </div>
      </MissionPanel>

      <MissionPanel aria-label="Prediction history">
        <SectionHeader kicker="Mission Log" title="Prediction History" />
        {predictionHistory.length === 0 ? (
          <EmptyState title="No Predictions Yet" description="Run a conjunction prediction to populate the mission log." />
        ) : (
          <table className="mc-data-table mt-4">
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
                  <td><StatusBadge severity={severityForRisk[historyItem.riskLevel] || 'unknown'}>{historyItem.riskLevel}</StatusBadge></td>
                  <td>{formatNumber(historyItem.altitudeDifference, 3)}</td>
                  <td>{formatNumber(historyItem.relativeVelocity, 3)}</td>
                  <td>{formatDateTime(historyItem.timestamp)}</td>
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
      </MissionPanel>

      <MissionPanel aria-label="System Health Panel">
        <SectionHeader kicker="Mission Status" title="System Health Dashboard" />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="mc-panel-inset p-3"><TelemetryValue label="Database Status" value={systemHealth?.databaseStatus || 'Unknown'} severity={systemHealth?.databaseStatus === 'Healthy' ? 'normal' : 'warning'} /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="API Status" value={systemHealth?.apiStatus || 'Unknown'} severity={systemHealth?.apiStatus === 'Healthy' ? 'normal' : 'warning'} /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Orbital Objects" value={systemHealth?.totalOrbitalObjects ?? 0} /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Total Predictions" value={systemHealth?.totalPredictions ?? 0} /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Critical Events" value={systemHealth?.totalCriticalEvents ?? 0} severity={(systemHealth?.totalCriticalEvents || 0) > 0 ? 'critical' : 'normal'} /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Last Prediction Time" value={formatDateTime(systemHealth?.lastPredictionTime)} /></div>
        </div>
      </MissionPanel>

      <MissionPanel aria-label="Analytics summary">
        <SectionHeader kicker="Risk Analytics" title="Analytics Summary" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <div className="mc-panel-inset p-3"><TelemetryValue label="Total Predictions" value={analyticsSummary?.totalPredictions ?? 0} /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Low" value={analyticsSummary?.lowRiskCount ?? 0} severity="normal" /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Medium" value={analyticsSummary?.mediumRiskCount ?? 0} severity="advisory" /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="High" value={analyticsSummary?.highRiskCount ?? 0} severity="warning" /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Critical" value={analyticsSummary?.criticalRiskCount ?? 0} severity="critical" /></div>
          <div className="mc-panel-inset p-3"><TelemetryValue label="Avg Rel Velocity" value={formatNumber(analyticsSummary?.averageRelativeVelocity, 2)} /></div>
        </div>
      </MissionPanel>

      <MissionPanel aria-label="3D Orbital Visualization" padded={false}>
        <div className="border-b border-white/[0.08] p-4 sm:p-5">
          <SectionHeader kicker="Orbital Viewport" title="3D Orbital Visualization" />
        </div>
        <div className="p-4 sm:p-5">
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
        </div>
      </MissionPanel>

      <MissionPanel aria-label="Prediction timeline">
        <SectionHeader kicker="Operational Event Timeline" title="Timeline" />
        {predictionTimeline.length === 0 ? (
          <EmptyState title="No Timeline Entries" description="Prediction events will appear here after analysis." />
        ) : (
          <Timeline items={activeTimelineItems} className="mt-4" />
        )}
      </MissionPanel>

      <MissionPanel aria-label="Priority Queue" tone={priorityQueue.length > 0 ? 'warning' : 'default'}>
        <SectionHeader
          kicker="Live Conjunction Queue"
          title="Risk Prioritization Queue"
          actions={<StatusBadge severity={topQueueEvent ? (severityForRisk[topQueueEvent.riskLevel] || 'warning') : 'unknown'}>{priorityQueue.length} Events</StatusBadge>}
        />
        {priorityQueue.length === 0 ? (
          <EmptyState title="No Prioritized Events" description="No conjunction events are currently in the live queue." />
        ) : (
          <table className="mc-data-table mt-4">
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
                  <td>{getObjectLabel(event.primaryObject)}</td>
                  <td>{getObjectLabel(event.secondaryObject)}</td>
                  <td><StatusBadge severity={severityForRisk[event.riskLevel] || 'unknown'}>{event.riskLevel}</StatusBadge></td>
                  <td>{event.missionImpact ? `${event.missionImpact.missionCategory} / ${event.missionImpact.impactLevel}` : '--'}</td>
                  <td>{formatPercent(event.confidence?.confidenceScore, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </MissionPanel>

      <MissionPanel aria-label="Mission Audit Log">
        <SectionHeader
          kicker="Operator Event Log"
          title="Mission Audit Log"
          actions={(
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="mc-command-button"
          >
            Refresh Log
          </button>
          )}
        />
        {auditLogs.length === 0 ? (
          <EmptyState title="No Operational Logs" description="Audit events will appear here as operators and services act." />
        ) : (
          <div className="mt-4 max-h-[320px] overflow-y-auto">
            <table className="mc-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Scope / Target</th>
                  <th>Severity</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>{log.eventType}</td>
                    <td>{log.objectName}</td>
                    <td><StatusBadge severity={severityForRisk[log.severity] || 'unknown'}>{log.severity}</StatusBadge></td>
                    <td>{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MissionPanel>

            </div>

            <aside className="grid content-start gap-4">
              <MissionPanel aria-label="Active alerts" tone={alerts.length > 0 ? 'warning' : 'default'}>
                <SectionHeader
                  kicker="Right Console"
                  title="Active Alerts"
                  actions={(
                    <button type="button" className="mc-command-button" onClick={() => setAlerts([])}>
                      Clear All
                    </button>
                  )}
                />
                {alerts.length === 0 ? (
                  <EmptyState title="No Active Alerts" description="System status nominal." />
                ) : (
                  <div className="mt-4 grid max-h-[280px] gap-2 overflow-y-auto pr-1">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="mc-panel-inset flex items-start justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500">{alert.timestamp}</span>
                            <StatusBadge severity={severityForRisk[alert.severity] || 'unknown'}>{alert.severity}</StatusBadge>
                          </div>
                          <p className="mc-body mt-2">{alert.message}</p>
                        </div>
                        <button
                          type="button"
                          className="text-sm font-bold text-slate-500 hover:text-slate-200"
                          onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </MissionPanel>

              <MissionPanel aria-label="Risk gauge">
                <SectionHeader kicker="Risk Gauge" title="Current Risk" actions={<StatusBadge severity={riskSeverity}>{prediction?.riskLevel || 'Unknown'}</StatusBadge>} />
                <div className="mt-4 rounded-full border border-white/[0.08] bg-slate-950 p-4">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        prediction?.riskLevel === 'Critical' ? 'bg-rose-500' :
                        prediction?.riskLevel === 'High' ? 'bg-orange-500' :
                        prediction?.riskLevel === 'Medium' ? 'bg-amber-400' :
                        prediction?.riskLevel === 'Low' ? 'bg-emerald-400' :
                        'bg-slate-600'
                      }`}
                      style={{
                        width:
                          prediction?.riskLevel === 'Critical' ? '100%' :
                          prediction?.riskLevel === 'High' ? '75%' :
                          prediction?.riskLevel === 'Medium' ? '50%' :
                          prediction?.riskLevel === 'Low' ? '25%' :
                          '8%',
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Probability" value={formatPercent(collisionProbability, 4)} /></div>
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Confidence" value={formatPercent(confidenceValue, 2)} /></div>
                </div>
              </MissionPanel>

              <MissionPanel aria-label="Recommended maneuver">
                <SectionHeader kicker="Decision Support" title="Recommended Maneuver" />
                <div className="mt-4 grid gap-3">
                  <div className="mc-panel-inset p-3">
                    <TelemetryValue
                      label="Optimal Maneuver"
                      value={prediction?.avoidanceRecommendations?.optimalManeuver || simulationResult?.recommendation || '--'}
                    />
                  </div>
                  <p className="mc-body">{prediction?.recommendation || 'Run a prediction to generate recommendation text.'}</p>
                </div>
              </MissionPanel>

              <MissionPanel aria-label="Operator checklist">
                <SectionHeader kicker="Operator Checklist" title="Readiness Steps" />
                <div className="mt-4 grid gap-2">
                  {checklistItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b border-white/[0.06] py-2 last:border-b-0">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">{item.label}</span>
                      <StatusBadge severity={item.complete ? 'normal' : 'unknown'}>{item.complete ? 'Done' : 'Pending'}</StatusBadge>
                    </div>
                  ))}
                </div>
              </MissionPanel>

              <MissionPanel aria-label="Mission status">
                <SectionHeader kicker="Mission Status" title="Console Health" />
                <div className="mt-4 grid gap-3">
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Database" value={systemHealth?.databaseStatus || 'Unknown'} severity={systemHealth?.databaseStatus === 'Healthy' ? 'normal' : 'warning'} /></div>
                  <div className="mc-panel-inset p-3"><TelemetryValue label="API" value={systemHealth?.apiStatus || 'Unknown'} severity={systemHealth?.apiStatus === 'Healthy' ? 'normal' : 'warning'} /></div>
                  <div className="mc-panel-inset p-3"><TelemetryValue label="Priority Lead" value={topQueueEvent ? `${getObjectLabel(topQueueEvent.primaryObject)} / ${getObjectLabel(topQueueEvent.secondaryObject)}` : '--'} /></div>
                </div>
              </MissionPanel>

              <MissionPanel aria-label="Audit event stream">
                <SectionHeader kicker="Recent Operator Events" title="Audit Stream" />
                {auditTimelineItems.length === 0 ? (
                  <EmptyState title="No Audit Events" description="No operator events are currently recorded." />
                ) : (
                  <Timeline items={auditTimelineItems} className="mt-4" />
                )}
              </MissionPanel>
            </aside>
          </div>

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
        </>
      )}
    </main>
  );
}
