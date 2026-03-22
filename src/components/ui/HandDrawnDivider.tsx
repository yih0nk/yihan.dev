export default function HandDrawnDivider({ className }: { className?: string }) {
  return (
    <div className={`w-full px-6 py-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 1200 12"
        fill="none"
        preserveAspectRatio="none"
        className="w-full h-3"
        aria-hidden="true"
      >
        <path
          d="M0 6 C100 2, 200 9, 300 5 C400 1, 500 8, 600 5 C700 2, 800 9, 900 4 C1000 1, 1100 8, 1200 5"
          stroke="#CCCCCC"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
