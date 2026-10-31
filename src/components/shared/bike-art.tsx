import { cn } from "@/lib/cn";

type BikeArtProps = {
  color?: string;
  className?: string;
  title?: string;
  variant?: "motorcycle" | "scooter";
};

function ScooterArt({ color }: { color: string }) {
  return (
    <>
      <ellipse cx="200" cy="268" rx="150" ry="9" fill="#111" opacity="0.1" />
      <g fill="none">
        <circle cx="96" cy="222" r="38" stroke="#1a1a1a" strokeWidth="13" />
        <circle cx="96" cy="222" r="26" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="304" cy="222" r="38" stroke="#1a1a1a" strokeWidth="13" />
        <circle cx="304" cy="222" r="26" stroke="#9ca3af" strokeWidth="2" />
      </g>
      <circle cx="96" cy="222" r="8" fill="#d1d5db" />
      <circle cx="304" cy="222" r="8" fill="#d1d5db" />
      <path d="M118 214 H250 L262 190 L252 140 L116 150 C100 156 92 176 96 200 Z" fill={color} />
      <path d="M96 168 C90 140 112 118 160 116 L206 118 L200 150 L106 156 Z" fill={color} />
      <path d="M104 122 C130 104 188 104 214 118 L206 134 C176 126 134 128 108 138 Z" fill="#1a1a1a" />
      <path d="M262 190 L286 120 L300 124 L282 196 Z" fill={color} />
      <path d="M304 222 L286 108" stroke="#6b7280" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M278 100 L292 92 L312 96" stroke="#1a1a1a" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M296 92 L290 68" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="289" cy="64" rx="8" ry="5" fill="#374151" />
      <circle cx="310" cy="124" r="11" fill="#e5e7eb" stroke="#1a1a1a" strokeWidth="4" />
      <circle cx="310" cy="124" r="5" fill="#fde68a" />
      <circle cx="92" cy="146" r="5" fill="#ef4444" />
      <rect x="132" y="190" width="70" height="30" rx="12" fill="#3a3a3a" />
    </>
  );
}

export function BikeArt({ color = "#C8102E", className, title, variant = "motorcycle" }: BikeArtProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("size-full", className)}
    >
      {variant === "scooter" ? (
        <ScooterArt color={color} />
      ) : (
        <>
      <ellipse cx="200" cy="268" rx="165" ry="9" fill="#111" opacity="0.1" />
      <g fill="none">
        <circle cx="92" cy="212" r="50" stroke="#1a1a1a" strokeWidth="14" />
        <circle cx="92" cy="212" r="36" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="308" cy="212" r="50" stroke="#1a1a1a" strokeWidth="14" />
        <circle cx="308" cy="212" r="36" stroke="#9ca3af" strokeWidth="2" />
      </g>
      <circle cx="92" cy="212" r="9" fill="#d1d5db" />
      <circle cx="308" cy="212" r="9" fill="#d1d5db" />
      <path d="M92 212 L160 196 L214 176" stroke="#2b2b2b" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M160 196 L196 120" stroke="#2b2b2b" strokeWidth="8" strokeLinecap="round" fill="none" />
      <rect x="150" y="164" width="76" height="52" rx="12" fill="#3a3a3a" />
      <rect x="164" y="150" width="40" height="22" rx="6" fill="#4b4b4b" />
      <circle cx="188" cy="190" r="12" fill="#6b7280" />
      <path d="M150 204 L84 224 L60 226" stroke="#9ca3af" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M308 212 L274 112" stroke="#6b7280" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M296 150 L282 128" stroke="#2b2b2b" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path
        d="M186 118 C196 86 238 82 262 104 C268 110 266 122 256 124 L196 134 C188 135 184 126 186 118 Z"
        fill={color}
      />
      <path d="M118 128 C140 112 176 114 196 124 L190 138 C168 134 140 138 112 146 Z" fill="#1a1a1a" />
      <path d="M104 140 L84 132" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
      <circle cx="82" cy="131" r="5" fill="#ef4444" />
      <path d="M262 100 L282 86 L298 90" stroke="#1a1a1a" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M284 86 L278 62" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="277" cy="58" rx="8" ry="5" fill="#374151" />
      <circle cx="288" cy="116" r="15" fill="#e5e7eb" stroke="#1a1a1a" strokeWidth="5" />
      <circle cx="288" cy="116" r="7" fill="#fde68a" />
      <path d="M268 160 C286 150 322 152 340 170" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}
