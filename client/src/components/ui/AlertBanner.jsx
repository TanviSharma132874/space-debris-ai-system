import { getSeverityClassName, normalizeSeverity } from '../../utils/severity';
import { classNames } from './classNames';

export default function AlertBanner({
  severity = 'advisory',
  title,
  children,
  action,
  className = '',
}) {
  const normalizedSeverity = normalizeSeverity(severity);

  return (
    <div
      className={classNames('mc-alert-banner', className)}
      data-severity={normalizedSeverity}
      role={normalizedSeverity === 'critical' ? 'alert' : 'status'}
    >
      <span
        className={classNames(
          'mt-1 h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_currentColor]',
          getSeverityClassName(normalizedSeverity),
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        {title && <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-100">{title}</p>}
        {children && <div className="mc-body mt-1">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
