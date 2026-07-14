export const SEVERITY_LEVELS = {
  normal: {
    label: 'Normal',
    className: 'mc-status-normal',
    tone: 'normal',
  },
  low: {
    label: 'Low',
    className: 'mc-status-low',
    tone: 'low',
  },
  medium: {
    label: 'Medium',
    className: 'mc-status-medium',
    tone: 'medium',
  },
  high: {
    label: 'High',
    className: 'mc-status-high',
    tone: 'high',
  },
  active: {
    label: 'Active',
    className: 'mc-status-active',
    tone: 'active',
  },
  processing: {
    label: 'Processing',
    className: 'mc-status-processing',
    tone: 'processing',
  },
  advisory: {
    label: 'Advisory',
    className: 'mc-status-advisory',
    tone: 'advisory',
  },
  warning: {
    label: 'Warning',
    className: 'mc-status-warning',
    tone: 'warning',
  },
  critical: {
    label: 'Critical',
    className: 'mc-status-critical',
    tone: 'critical',
  },
  unknown: {
    label: 'Unknown',
    className: 'mc-status-unknown',
    tone: 'unknown',
  },
};

export const normalizeSeverity = (severity) => {
  const normalized = `${severity || 'unknown'}`.toLowerCase();
  return SEVERITY_LEVELS[normalized] ? normalized : 'unknown';
};

export const getSeverityMeta = (severity) => (
  SEVERITY_LEVELS[normalizeSeverity(severity)]
);

export const getSeverityClassName = (severity) => (
  getSeverityMeta(severity).className
);
