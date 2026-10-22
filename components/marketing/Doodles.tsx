/** Hand-drawn style bits used around the marketing page. Plain strokes, no fills. */

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10c30 2 60 30 108 36" />
      <path d="M100 36l12 10-16 2" />
    </svg>
  );
}

export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 20" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 12c12-8 24-8 36 0s24 8 36 0 24-8 36 0 24 8 36 0 24-8 36 0" />
    </svg>
  );
}

export function Bowl({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <g className="steam">
        <path d="M36 34c0-5 5-5 5-10s-5-5-5-10" />
        <path d="M48 36c0-5 5-5 5-10s-5-5-5-10" />
        <path d="M60 34c0-5 5-5 5-10s-5-5-5-10" />
      </g>
      <path d="M16 46h64c1.7 0 3 1.3 3 3 0 17-14 30-33 30h-4C27 79 13 66 13 49c0-1.7 1.3-3 3-3z" fill="var(--color-sand)" />
      <path d="M13 49h70" />
      <path d="M30 86h36" />
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
    </svg>
  );
}
