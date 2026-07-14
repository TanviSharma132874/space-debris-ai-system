import { classNames } from './classNames';

export default function LoadingIndicator({
  label = 'Loading telemetry',
  className = '',
}) {
  return (
    <span className={classNames('mc-loading-indicator', className)}>
      {label}
    </span>
  );
}
