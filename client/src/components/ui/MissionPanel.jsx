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
      className={classNames('mc-panel', padded && 'p-4 sm:p-5', className)}
      data-tone={tone}
      {...props}
    >
      {children}
    </Component>
  );
}
