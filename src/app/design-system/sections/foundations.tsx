import { BellIcon, CalendarCheckIcon, HeartIcon, HouseIcon, MotorcycleIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { colors, radii, spacing } from "@/design-system/tokens";
import { Demo, Section } from "../section";

const palette = [
  { name: "Primary yellow", hex: colors.brand, fg: "#111111", note: "Text on it: #111111" },
  { name: "Primary text", hex: colors.ink, fg: "#FFFFFF", note: "Text on it: #FFFFFF" },
  { name: "Background", hex: colors.canvas, fg: "#111111", note: "Page canvas" },
  { name: "Surface", hex: colors.surface, fg: "#111111", note: "Cards, sheets" },
  { name: "Border", hex: colors.line, fg: "#111111", note: "1px dividers" },
  { name: "Muted text", hex: colors.subtle, fg: "#FFFFFF", note: "Secondary copy" },
  { name: "Success", hex: colors.success, fg: "#111111", note: "Text on it: #111111" },
  { name: "Error", hex: colors.danger, fg: "#111111", note: "Text on it: #111111" },
];

const typeScale = [
  { label: "Display", className: "text-3xl font-extrabold tracking-tight", sample: "Freedom starts here" },
  { label: "Title", className: "text-2xl font-extrabold tracking-tight", sample: "Royal Enfield Classic 350" },
  { label: "Heading", className: "text-lg font-bold", sample: "Popular bikes" },
  { label: "Body", className: "text-base", sample: "Premium bikes. Flexible rentals." },
  { label: "Caption", className: "text-xs font-medium text-subtle", sample: "Jaipur, Rajasthan" },
];

const icons = [
  { Icon: HouseIcon, name: "House" },
  { Icon: MotorcycleIcon, name: "Motorcycle" },
  { Icon: CalendarCheckIcon, name: "Calendar" },
  { Icon: HeartIcon, name: "Heart" },
  { Icon: BellIcon, name: "Bell" },
  { Icon: UserIcon, name: "User" },
];

export function FoundationsSection() {
  return (
    <Section id="foundations" title="Foundations" description="Tokens shared by every component. Black and yellow, rounded, quiet borders.">
      <Demo title="Colour">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {palette.map((swatch) => (
            <li key={swatch.name} className="overflow-hidden rounded-control border border-line">
              <div
                className="flex h-16 items-end p-2 text-xs font-bold"
                style={{ background: swatch.hex, color: swatch.fg }}
              >
                Aa
              </div>
              <div className="p-2">
                <p className="text-xs font-bold">{swatch.name}</p>
                <p className="tabular text-xs text-subtle">{swatch.hex}</p>
                <p className="text-[11px] text-subtle">{swatch.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Demo>

      <div className="grid gap-8 md:grid-cols-2">
        <Demo title="Typography · Plus Jakarta Sans">
          <ul className="flex flex-col gap-4">
            {typeScale.map((row) => (
              <li key={row.label} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold tracking-wide text-subtle uppercase">{row.label}</span>
                <span className={row.className}>{row.sample}</span>
              </li>
            ))}
          </ul>
        </Demo>

        <div className="flex flex-col gap-8">
          <Demo title="Spacing (px)">
            <ul className="flex flex-col gap-2">
              {spacing.map((value) => (
                <li key={value} className="flex items-center gap-3 text-xs">
                  <span className="tabular w-8 text-subtle">{value}</span>
                  <span className="h-3 rounded-sm bg-brand" style={{ width: value * 3 }} />
                </li>
              ))}
            </ul>
          </Demo>

          <Demo title="Radius">
            <ul className="flex flex-wrap gap-4">
              {Object.entries(radii).map(([name, value]) => (
                <li key={name} className="flex flex-col items-center gap-2 text-xs">
                  <span
                    className="size-14 border-2 border-ink bg-brand-soft"
                    style={{ borderRadius: Math.min(value, 28) }}
                  />
                  <span className="font-semibold">{name}</span>
                  <span className="tabular text-subtle">{value === 9999 ? "full" : `${value}px`}</span>
                </li>
              ))}
            </ul>
          </Demo>
        </div>
      </div>

      <Demo title="Icons · Phosphor, 20px controls / 24px navigation, regular → fill when selected">
        <ul className="flex flex-wrap gap-6">
          {icons.map(({ Icon, name }) => (
            <li key={name} className="flex flex-col items-center gap-2 text-xs text-subtle">
              <span className="flex items-center gap-3 text-ink">
                <Icon size={20} />
                <Icon size={24} />
                <Icon size={24} weight="fill" />
              </span>
              {name}
            </li>
          ))}
        </ul>
      </Demo>
    </Section>
  );
}
