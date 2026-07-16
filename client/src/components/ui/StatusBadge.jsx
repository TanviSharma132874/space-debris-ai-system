import { getSeverityClassName, getSeverityMeta, normalizeSeverity } from '../../utils/severity';
import { classNames } from './classNames';

export default function StatusBadge({
  severity = 'unknown',
  status,
  children,
  className = '',
  pulse = false,
  ...props
}) {
  const normalizedSeverity = normalizeSeverity(status || severity);
  const meta = getSeverityMeta(normalizedSeverity);

  return (
    <span
      className={classNames(
        'mc-status-badge inline-flex min-h-[1.375rem] items-center justify-center rounded border px-2 py-0.5 text-[10px] font-black uppercase leading-none tracking-wide',
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
