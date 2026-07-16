import { getSeverityClassName, normalizeSeverity } from '../../utils/severity';
import { classNames } from './classNames';
import StatusBadge from './StatusBadge';

const formatUtcTimestamp = (timestamp) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return `${date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z')}`;
};

export default function Timeline({
  items = [],
  getKey,
  className = '',
  currentIndex,
  isPlaying = false,
  onPlay,
  onPause,
  onPrevious,
  onNext,
}) {
  const hasControls = Boolean(onPlay || onPause || onPrevious || onNext);
  const hasCurrentIndex = Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < items.length;
  const progress = items.length > 1 && hasCurrentIndex
    ? (currentIndex / (items.length - 1)) * 100
    : hasCurrentIndex
      ? 100
      : 0;

  return (
    <div className={classNames('mc-timeline space-y-3', className)}>
      {(hasControls || hasCurrentIndex) && (
        <div className="rounded border border-slate-800/80 bg-slate-950/70 p-2">
          {hasControls && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {onPrevious && (
                <button type="button" onClick={onPrevious} className="rounded border border-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-300 hover:bg-slate-900">
                  Previous
                </button>
              )}
              {onPlay && !isPlaying && (
                <button type="button" onClick={onPlay} className="rounded border border-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-300 hover:bg-slate-900">
                  Play
                </button>
              )}
              {onPause && isPlaying && (
                <button type="button" onClick={onPause} className="rounded border border-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-300 hover:bg-slate-900">
                  Pause
                </button>
              )}
              {onNext && (
                <button type="button" onClick={onNext} className="rounded border border-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-300 hover:bg-slate-900">
                  Next
                </button>
              )}
            </div>
          )}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-3 border-l border-slate-800/90 pl-4">
        {items.map((item, index) => {
          const severity = normalizeSeverity(item.severity);
          const isCurrent = Boolean(item.current || item.isCurrent || (hasCurrentIndex && index === currentIndex));
          const timestamp = formatUtcTimestamp(item.timestamp);

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
                <div className="flex items-center gap-2">
                  <StatusBadge severity={severity}>{severity}</StatusBadge>
                  {timestamp && <span className="font-mono text-[10px] text-slate-500">{timestamp}</span>}
                </div>
              </div>
              {item.title && <p className="mt-1 text-xs font-semibold text-slate-100">{item.title}</p>}
              {item.description && <p className="mc-body mt-1.5 leading-relaxed">{item.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
