import { cn } from "@/lib/cn";

type BikeArtProps = {
  /** Tank / body colour. */
  color?: string;
  className?: string;
  /** Accessible description; omit for decorative use. */
  title?: string;
};

/**
 * Vector placeholder for motorcycle photography. The viewBox is fixed and the
 * SVG scales with `meet`, so it can never stretch inside any aspect ratio.
 */
export function BikeArt({ color = "#FFC400", className, title }: BikeArtProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("size-full", className)}
    >
      <ellipse cx="200" cy="268" rx="165" ry="9" fill="#111" opacity="0.1" />
      {/* wheels */}
      <g fill="none">
        <circle cx="92" cy="212" r="50" stroke="#1a1a1a" strokeWidth="14" />
        <circle cx="92" cy="212" r="36" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="308" cy="212" r="50" stroke="#1a1a1a" strokeWidth="14" />
        <circle cx="308" cy="212" r="36" stroke="#9ca3af" strokeWidth="2" />
      </g>
      <circle cx="92" cy="212" r="9" fill="#d1d5db" />
      <circle cx="308" cy="212" r="9" fill="#d1d5db" />
      {/* swingarm + frame */}
      <path d="M92 212 L160 196 L214 176" stroke="#2b2b2b" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M160 196 L196 120" stroke="#2b2b2b" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* engine */}
      <rect x="150" y="164" width="76" height="52" rx="12" fill="#3a3a3a" />
      <rect x="164" y="150" width="40" height="22" rx="6" fill="#4b4b4b" />
      <circle cx="188" cy="190" r="12" fill="#6b7280" />
      {/* exhaust */}
      <path d="M150 204 L84 224 L60 226" stroke="#9ca3af" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* fork + front */}
      <path d="M308 212 L274 112" stroke="#6b7280" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M296 150 L282 128" stroke="#2b2b2b" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* tank */}
      <path
        d="M186 118 C196 86 238 82 262 104 C268 110 266 122 256 124 L196 134 C188 135 184 126 186 118 Z"
        fill={color}
      />
      {/* seat */}
      <path d="M118 128 C140 112 176 114 196 124 L190 138 C168 134 140 138 112 146 Z" fill="#1a1a1a" />
      {/* rear light + fender */}
      <path d="M104 140 L84 132" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
      <circle cx="82" cy="131" r="5" fill="#ef4444" />
      {/* handlebar + mirror */}
      <path d="M262 100 L282 86 L298 90" stroke="#1a1a1a" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M284 86 L278 62" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="277" cy="58" rx="8" ry="5" fill="#374151" />
      {/* headlight */}
      <circle cx="288" cy="116" r="15" fill="#e5e7eb" stroke="#1a1a1a" strokeWidth="5" />
      <circle cx="288" cy="116" r="7" fill="#fde68a" />
      {/* front fender */}
      <path d="M268 160 C286 150 322 152 340 170" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
    </svg>
  );
}
