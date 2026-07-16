import { classNames } from './classNames';

export default function CommandButton({
  as: Component = 'button',
  variant = 'secondary',
  icon,
  children,
  className = '',
  type,
  ...props
}) {
  const buttonType = Component === 'button' ? (type || 'button') : type;

  return (
    <Component
      className={classNames(
        'mc-command-button inline-flex min-h-[2rem] items-center justify-center gap-2 rounded border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors',
        'hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100',
        'active:translate-y-px active:border-slate-500 active:bg-slate-950',
        'disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-600 disabled:opacity-70',
        className,
      )}
      data-variant={variant}
      type={buttonType}
      {...props}
    >
      {icon && <span className="flex h-4 w-4 items-center justify-center" aria-hidden="true">{icon}</span>}
      <span className="leading-none">{children}</span>
    </Component>
  );
}
