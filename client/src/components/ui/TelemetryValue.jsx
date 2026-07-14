import { classNames } from './classNames';
import { getSeverityClassName } from '../../utils/severity';

export default function TelemetryValue({
  label,
  value,
  unit,
  severity,
  className = '',
}) {
  return (
    <div className={classNames('grid gap-1', className)}>
      {label && <span className="mc-telemetry-label">{label}</span>}
      <span className={classNames('mc-telemetry-value', severity && getSeverityClassName(severity))}>
        {value ?? '--'}
        {unit && <span className="ml-1 text-xs font-medium text-slate-500">{unit}</span>}
      </span>
    </div>
  );
}
