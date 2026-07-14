import { getSeverityClassName, normalizeSeverity } from '../../utils/severity';
import { classNames } from './classNames';

export default function Timeline({
  items = [],
  getKey,
  className = '',
}) {
  return (
    <div className={classNames('mc-timeline', className)}>
      {items.map((item, index) => {
        const severity = normalizeSeverity(item.severity);

        return (
          <div
            key={getKey ? getKey(item, index) : item.id || item.timestamp || index}
            className="mc-timeline-item"
          >
            <span
              className={classNames(
                'absolute -left-1 top-0.5 h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]',
                getSeverityClassName(severity),
              )}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mc-kicker">{item.label || item.type || 'Mission Event'}</span>
              {item.timestamp && <span className="text-[10px] text-slate-500">{item.timestamp}</span>}
            </div>
            {item.title && <p className="mt-1 text-xs font-semibold text-slate-100">{item.title}</p>}
            {item.description && <p className="mc-body mt-1">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
