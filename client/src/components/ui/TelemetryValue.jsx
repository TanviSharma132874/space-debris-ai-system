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
    <div className={classNames('grid gap-1.5 rounded border border-slate-800/70 bg-slate-950/70 px-3 py-2', className)}>
      {label && <span className="mc-telemetry-label text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>}
      <span className={classNames('mc-telemetry-value tabular-nums font-mono text-lg font-black leading-none text-slate-100', severity && getSeverityClassName(severity))}>
        {value ?? '--'}
        {unit && <span className="ml-1.5 align-baseline text-[10px] font-bold uppercase tracking-wide text-slate-500">{unit}</span>}
      </span>
    </div>
  );
}
