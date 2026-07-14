import { getSeverityClassName, getSeverityMeta, normalizeSeverity } from '../../utils/severity';
import { classNames } from './classNames';

export default function StatusBadge({
  severity = 'unknown',
  children,
  className = '',
  pulse = false,
  ...props
}) {
  const normalizedSeverity = normalizeSeverity(severity);
  const meta = getSeverityMeta(normalizedSeverity);

  return (
    <span
      className={classNames(
        'mc-status-badge',
        getSeverityClassName(normalizedSeverity),
        pulse && 'mc-animate-pulse',
        className,
      )}
      data-severity={normalizedSeverity}
      {...props}
    >
      {children || meta.label}
    </span>
  );
}
