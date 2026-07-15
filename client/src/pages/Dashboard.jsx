import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Scene3D from '../components/3d/Scene3D';
import {
  EmptyState,
  MissionPanel,
  SectionHeader,
  StatusBadge,
  TelemetryValue,
  Timeline,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { prepareVisualizationData } from '../services/visualizationAdapter';

const severityForRisk = {
  Critical: 'critical',
  High: 'warning',
  Medium: 'advisory',
  Low: 'normal',
};

const formatUtc = (date = new Date()) => (
  date.toISOString().replace('T', ' ').substring(0, 19)
);

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return formatUtc(date);
};

const getHealthSeverity = (status) => {
  if (!status) return 'unknown';
  return status === 'Healthy' ? 'normal' : 'warning';
};

const getThreatLevel = (summary) => {
  if (!summary) return { label: 'Pending', severity: 'unknown' };
  if ((summary.criticalRiskCount || 0) > 0) return { label: 'Critical', severity: 'critical' };
  if ((summary.highRiskCount || 0) > 0) return { label: 'High', severity: 'warning' };
  if ((summary.mediumRiskCount || 0) > 0) return { label: 'Medium', severity: 'advisory' };
  if ((summary.lowRiskCount || 0) > 0) return { label: 'Low', severity: 'normal' };
  return { label: 'No Predictions', severity: 'unknown' };
};

const getObjectName = (object) => {
  if (!object) return 'Unassigned object';
  if (typeof object === 'string') return object;
  return object.name || object.catalogNumber || object._id || 'Unassigned object';
};

function StatusRow({ label, value, severity = 'unknown', detail }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-200">{label}</p>
        {detail && <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>}
      </div>
      <StatusBadge severity={severity}>{value ?? '--'}</StatusBadge>
    </div>
  );
}

function CompactMetric({ label, value, severity, unit }) {
  return (
    <div className="mc-panel-inset p-3">
      <TelemetryValue label={label} value={value} unit={unit} severity={severity} />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [orbitalObjects, setOrbitalObjects] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [error, setError] = useState('');
  const [utcNow, setUtcNow] = useState(() => formatUtc());

  useEffect(() => {
    const interval = setInterval(() => setUtcNow(formatUtc()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const trackedTleCount = useMemo(
    () => orbitalObjects.filter((item) => item.tle?.line1 && item.tle?.line2).length,
    [orbitalObjects],
  );

  const latestCatalogUpdate = useMemo(() => {
    const timestamps = orbitalObjects
      .map((item) => item.tle?.lastUpdated || item.tracking?.lastPropagated || item.updatedAt || item.createdAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));

    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [orbitalObjects]);

  const riskBreakdown = [
    { label: 'Critical', value: analyticsSummary?.criticalRiskCount ?? 0, severity: 'critical' },
    { label: 'High', value: analyticsSummary?.highRiskCount ?? 0, severity: 'warning' },
    { label: 'Medium', value: analyticsSummary?.mediumRiskCount ?? 0, severity: 'advisory' },
    { label: 'Low', value: analyticsSummary?.lowRiskCount ?? 0, severity: 'normal' },
  ];

  const threatLevel = getThreatLevel(analyticsSummary);
  const operatorName = user?.name || user?.email || 'Authenticated Operator';
  const visualizationData = prepareVisualizationData({
    orbitalObjects,
    predictions: priorityQueue,
  });

  const latestThreats = priorityQueue.slice(0, 5);
  const eventFeed = [
    systemHealth && {
      label: 'System Health',
      severity: getHealthSeverity(systemHealth.databaseStatus),
      timestamp: utcNow,
      title: `API ${systemHealth.apiStatus ?? 'Unknown'} / Database ${systemHealth.databaseStatus ?? 'Unknown'}`,
      description: systemHealth.lastPredictionTime
        ? `Last prediction recorded ${formatDateTime(systemHealth.lastPredictionTime)} UTC.`
        : 'No prediction timestamp reported by the health service.',
    },
    ...latestThreats.slice(0, 4).map((item) => ({
      label: item.riskLevel || 'Threat Queue',
      severity: severityForRisk[item.riskLevel] || 'unknown',
      timestamp: formatDateTime(item.predictedTime || item.createdAt),
      title: `${getObjectName(item.primaryObject)} / ${getObjectName(item.secondaryObject)}`,
      description: item.recommendation || 'No recommendation supplied for this event.',
    })),
  ].filter(Boolean);

  const openTaskCount = priorityQueue.filter((item) => item.status === 'Pending' || item.status === 'Monitoring').length;
  const recommendations = [...new Set(priorityQueue.map((item) => item.recommendation).filter(Boolean))].slice(0, 4);

  return (
    <main className="select-none space-y-4">
      {error && (
        <p role="alert" className="mc-alert-banner" data-severity="critical">
          {error}
        </p>
      )}

      {!error && orbitalObjects.length === 0 && (
        <MissionPanel aria-label="First run mission setup" tone="warning">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <SectionHeader
              kicker="Mission Setup"
              title="No Orbital Telemetry Loaded"
              description="The mission database is empty. Load orbital objects to activate catalog tracking, collision analytics, and the operations wall."
            />
            <Link className="mc-command-button" data-variant="primary" to="/orbital-objects">
              Load Orbital Telemetry
            </Link>
          </div>
        </MissionPanel>
      )}

      <MissionPanel as="div" role="region" aria-label="Mission status wall" tone={threatLevel.severity === 'critical' ? 'critical' : 'active'}>
        <SectionHeader
          kicker="Mission Operations Center"
          title="Space Debris Monitoring Command"
          actions={<StatusBadge severity={threatLevel.severity}>Threat {threatLevel.label}</StatusBadge>}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <CompactMetric label="Mission Status" value={error ? 'Degraded' : 'Monitoring'} severity={error ? 'critical' : 'active'} />
          <CompactMetric label="Current Mission" value="Debris Watch" />
          <CompactMetric label="Threat Level" value={threatLevel.label} severity={threatLevel.severity} />
          <CompactMetric label="Objects Under Watch" value={orbitalObjects.length} />
          <CompactMetric label="Operator" value={operatorName} />
          <CompactMetric label="Current UTC" value={utcNow} />
        </div>
      </MissionPanel>

      <div role="region" aria-label="Mission operations wall" className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <MissionPanel aria-label="Orbital visualization" padded={false} className="min-h-[36rem]">
          <div className="border-b border-white/[0.08] p-4 sm:p-5">
            <SectionHeader
              kicker="Center Console"
              title="Orbital Visualization"
              description="Scene3D tactical map entry point using loaded orbital objects and prioritized collision events."
              actions={<StatusBadge severity={visualizationData.length ? 'active' : 'unknown'}>{visualizationData.length} Nodes</StatusBadge>}
            />
          </div>
          <div className="p-4 sm:p-5">
            <Scene3D visualizationData={visualizationData} />
          </div>
        </MissionPanel>

        <div className="grid gap-4">
          <MissionPanel aria-label="Mission health">
            <SectionHeader kicker="Right Console" title="Mission Health" />
            <div className="mt-3">
              <StatusRow label="API Gateway" value={systemHealth?.apiStatus ?? 'Unknown'} severity={getHealthSeverity(systemHealth?.apiStatus)} />
              <StatusRow label="Database" value={systemHealth?.databaseStatus ?? 'Unknown'} severity={getHealthSeverity(systemHealth?.databaseStatus)} />
              <StatusRow label="Prediction Store" value={systemHealth?.totalPredictions ?? '--'} severity={systemHealth ? 'active' : 'unknown'} detail="Events recorded" />
              <StatusRow label="Critical Events" value={systemHealth?.totalCriticalEvents ?? '--'} severity={(systemHealth?.totalCriticalEvents || 0) > 0 ? 'critical' : 'normal'} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {riskBreakdown.map((risk) => (
                <CompactMetric key={risk.label} label={risk.label} value={risk.value} severity={risk.severity} />
              ))}
            </div>
          </MissionPanel>

          <MissionPanel aria-label="Subsystem matrix">
            <SectionHeader kicker="Subsystem Matrix" title="Operational State" />
            <div className="mt-3 grid gap-2">
              <StatusRow label="Catalog Service" value={orbitalObjects.length > 0 ? 'Loaded' : 'Awaiting Data'} severity={orbitalObjects.length > 0 ? 'normal' : 'unknown'} />
              <StatusRow label="TLE Coverage" value={`${trackedTleCount}/${orbitalObjects.length}`} severity={trackedTleCount > 0 ? 'active' : 'unknown'} />
              <StatusRow label="Conjunction Analytics" value={analyticsSummary ? 'Available' : 'Pending'} severity={analyticsSummary ? 'active' : 'unknown'} />
              <StatusRow label="Priority Queue" value={priorityQueue.length > 0 ? 'Populated' : 'Empty'} severity={priorityQueue.length > 0 ? threatLevel.severity : 'unknown'} />
            </div>
          </MissionPanel>

          <MissionPanel aria-label="Telemetry status">
            <SectionHeader kicker="Telemetry Status" title="Catalog Signals" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <CompactMetric label="Satellites" value={objectCounts.Satellite} />
              <CompactMetric label="Debris" value={objectCounts.Debris + objectCounts.RocketBody} severity="warning" />
              <CompactMetric label="Unknown" value={objectCounts.Unknown} severity={objectCounts.Unknown ? 'advisory' : 'unknown'} />
              <CompactMetric label="Last Update" value={formatDateTime(latestCatalogUpdate)} />
            </div>
          </MissionPanel>
        </div>
      </div>

      <div role="region" aria-label="Threats and mission events" className="grid gap-4 xl:grid-cols-2">
        <MissionPanel aria-label="Active threat queue" tone={threatLevel.severity === 'critical' ? 'critical' : 'default'}>
          <SectionHeader
            kicker="Bottom Left"
            title="Active Threat Queue"
            actions={<StatusBadge severity={threatLevel.severity}>{latestThreats.length} Queued</StatusBadge>}
          />
          {latestThreats.length === 0 ? (
            <EmptyState title="No Active Threats" description="No prioritized collision events are currently available from the mission API." />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="mc-data-table">
                <thead>
                  <tr>
                    <th>Risk</th>
                    <th>Objects</th>
                    <th>Prediction UTC</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {latestThreats.map((item) => (
                    <tr key={item._id || `${item.predictedTime}-${item.riskLevel}`}>
                      <td><StatusBadge severity={severityForRisk[item.riskLevel] || 'unknown'}>{item.riskLevel || 'Unknown'}</StatusBadge></td>
                      <td>{getObjectName(item.primaryObject)} / {getObjectName(item.secondaryObject)}</td>
                      <td>{formatDateTime(item.predictedTime || item.createdAt)}</td>
                      <td>{item.status || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MissionPanel>

        <MissionPanel aria-label="Mission event feed">
          <SectionHeader kicker="Bottom Right" title="Mission Event Feed" />
          {eventFeed.length === 0 ? (
            <EmptyState title="No Mission Events" description="The dashboard has not received health or threat events yet." />
          ) : (
            <Timeline items={eventFeed} className="mt-4" />
          )}
        </MissionPanel>
      </div>

      <div role="region" aria-label="Operator actions and recommendations" className="grid gap-4 xl:grid-cols-2">
        <MissionPanel aria-label="Operator tasks">
          <SectionHeader kicker="Bottom Console" title="Operator Tasks" />
          <div className="mt-3 grid gap-2">
            <StatusRow label="Review Priority Queue" value={openTaskCount > 0 ? `${openTaskCount} Open` : 'Clear'} severity={openTaskCount > 0 ? threatLevel.severity : 'normal'} />
            <StatusRow label="Confirm Catalog Currency" value={latestCatalogUpdate ? 'Timestamped' : 'No Timestamp'} severity={latestCatalogUpdate ? 'active' : 'unknown'} />
            <StatusRow label="Validate Critical Events" value={(analyticsSummary?.criticalRiskCount || 0) > 0 ? 'Required' : 'Not Required'} severity={(analyticsSummary?.criticalRiskCount || 0) > 0 ? 'critical' : 'normal'} />
          </div>
        </MissionPanel>

        <MissionPanel aria-label="Mission recommendations">
          <SectionHeader kicker="Decision Support" title="Mission Recommendations" />
          {recommendations.length === 0 ? (
            <EmptyState title="No Recommendations" description="No recommendation text has been supplied by collision analytics." />
          ) : (
            <div className="mt-3 grid gap-2">
              {recommendations.map((recommendation) => (
                <div key={recommendation} className="mc-panel-inset p-3">
                  <p className="text-xs font-medium text-slate-200">{recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </MissionPanel>
      </div>
    </main>
  );
}
