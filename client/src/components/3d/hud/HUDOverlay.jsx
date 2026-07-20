export default function HUDOverlay({ children, layoutClass = "" }) {
  return (
    <div className={`absolute inset-0 pointer-events-none z-20 ${layoutClass}`}>
      <div className="pointer-events-auto w-full h-full relative">
        {children}
      </div>
    </div>
  );
}
