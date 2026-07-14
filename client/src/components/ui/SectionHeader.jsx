import { classNames } from './classNames';

export default function SectionHeader({
  kicker,
  title,
  description,
  actions,
  className = '',
}) {
  return (
    <div className={classNames('mc-section-header', className)}>
      <div className="min-w-0">
        {kicker && <p className="mc-kicker">{kicker}</p>}
        {title && <h2 className="mc-title mt-1">{title}</h2>}
        {description && <p className="mc-body mt-2 max-w-3xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
