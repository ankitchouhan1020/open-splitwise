type ShimmerProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function Shimmer({ className = "", style }: ShimmerProps) {
  return (
    <div
      className={`shimmer ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

export function ShimmerText({
  className = "",
  lines = 1,
  lastWidth = "w-4/5",
}: {
  className?: string;
  lines?: number;
  lastWidth?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {Array.from({ length: lines }, (_, i) => (
        <Shimmer
          key={i}
          className={`h-3.5 rounded-md ${i === lines - 1 && lines > 1 ? lastWidth : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function ShimmerCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-border bg-card rounded-2xl border p-5 shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}
