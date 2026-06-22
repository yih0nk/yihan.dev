interface TimelineItemProps {
  period: string;
  title: string;
  subtitle?: string;
  location?: string;
  bullets?: string[];
  isLast?: boolean;
}

export default function TimelineItem({
  period,
  title,
  subtitle,
  location,
  bullets,
  isLast = false,
}: TimelineItemProps) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />
      )}

      {/* Node — sketch-style circle */}
      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 border-2 border-black bg-white rounded-full" />

      <div className="pb-6">
        <p className="text-xs text-gray-400 mb-1 font-mono tracking-wide">
          {period}
        </p>
        <h3
          className="text-lg font-bold leading-tight"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
        )}
        {location && (
          <p className="text-xs text-gray-400 mt-0.5">{location}</p>
        )}
        {bullets && bullets.length > 0 && (
          <ul className="mt-3 space-y-1">
            {bullets.map((b, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-gray-300 select-none">—</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
