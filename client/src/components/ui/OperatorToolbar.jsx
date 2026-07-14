import { classNames } from './classNames';

export default function OperatorToolbar({
  title,
  meta,
  actions,
  filters,
  className = '',
}) {
  return (
    <div className={classNames('mc-operator-toolbar', className)}>
      <div className="min-w-0">
        {title && <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-100">{title}</p>}
        {meta && <p className="mc-body mt-1">{meta}</p>}
      </div>
      {filters && <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{filters}</div>}
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
