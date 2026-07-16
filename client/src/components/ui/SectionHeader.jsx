import { classNames } from './classNames';

export default function SectionHeader({
  kicker,
  title,
  description,
  actions,
  className = '',
}) {
  return (
    <div className={classNames('mc-section-header flex items-start justify-between gap-4 border-b border-slate-800/90 pb-3', className)}>
      <div className="min-w-0">
        {kicker && <p className="mc-kicker">{kicker}</p>}
        {title && <h2 className="mc-title mt-1 leading-tight">{title}</h2>}
        {description && <p className="mc-body mt-1.5 max-w-3xl leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5">{actions}</div>}
    </div>
  );
}
