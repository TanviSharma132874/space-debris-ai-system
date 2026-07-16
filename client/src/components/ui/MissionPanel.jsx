import { classNames } from './classNames';

export default function MissionPanel({
  as: Component = 'section',
  tone = 'default',
  padded = true,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={classNames(
        'mc-panel relative overflow-hidden border border-slate-800/90 bg-slate-950/95 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]',
        padded && 'p-3 sm:p-4',
        className,
      )}
      data-tone={tone}
      {...props}
    >
      {children}
    </Component>
  );
}
