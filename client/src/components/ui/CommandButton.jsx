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
      className={classNames('mc-command-button', className)}
      data-variant={variant}
      type={buttonType}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </Component>
  );
}
