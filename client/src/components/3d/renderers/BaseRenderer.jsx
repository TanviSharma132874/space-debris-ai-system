export default function BaseRenderer({ id, type, renderFn, data }) {
  return (
    <div data-renderer-id={id} data-renderer-type={type} className="renderer-node">
      {renderFn ? renderFn(data) : null}
    </div>
  );
}
