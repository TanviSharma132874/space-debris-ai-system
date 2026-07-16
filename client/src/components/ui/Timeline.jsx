import { getSeverityClassName, normalizeSeverity } from '../../utils/severity';
import { classNames } from './classNames';

export default function Timeline({
  items = [],
  getKey,
  className = '',
}) {
  return (
    <div className={classNames('mc-timeline space-y-3 border-l border-slate-800/90 pl-4', className)}>
      {items.map((item, index) => {
        const severity = normalizeSeverity(item.severity);
        const isCurrent = item.current || item.isCurrent || index === 0;

        return (
          <div
            key={getKey ? getKey(item, index) : item.id || item.timestamp || index}
            className={classNames(
              'mc-timeline-item relative rounded border border-slate-800/70 bg-slate-950/60 p-3',
              isCurrent && 'border-cyan-500/30 bg-cyan-950/10',
            )}
          >
            <span
              className={classNames(
                'absolute -left-[1.22rem] top-3 h-2.5 w-2.5 rounded-full border border-slate-950 shadow-[0_0_10px_currentColor]',
                getSeverityClassName(severity),
              )}
              aria-hidden="true"
            />
            {isCurrent && (
              <span className="absolute -left-[1.42rem] top-[0.66rem] h-4 w-4 rounded-full border border-cyan-400/40" aria-hidden="true" />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mc-kicker">{item.label || item.type || 'Mission Event'}</span>
              {item.timestamp && <span className="font-mono text-[10px] text-slate-500">{item.timestamp}</span>}
            </div>
            {item.title && <p className="mt-1 text-xs font-semibold text-slate-100">{item.title}</p>}
            {item.description && <p className="mc-body mt-1.5 leading-relaxed">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
