import CommandButton from './CommandButton';
import { classNames } from './classNames';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={classNames('mc-empty-state', className)}>
      <div className="max-w-md">
        {title && <p className="text-sm font-bold uppercase tracking-[0.1em] text-slate-200">{title}</p>}
        {description && <p className="mc-body mt-2">{description}</p>}
        {actionLabel && onAction && (
          <CommandButton className="mt-4" variant="primary" onClick={onAction}>
            {actionLabel}
          </CommandButton>
        )}
      </div>
    </div>
  );
}
