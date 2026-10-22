import { Breadcrumbs as HeroBreadcrumbs } from "@heroui/react";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <HeroBreadcrumbs>
      {items.map((item) => (
        <HeroBreadcrumbs.Item key={item.label} href={item.href}>
          {item.label}
        </HeroBreadcrumbs.Item>
      ))}
    </HeroBreadcrumbs>
  );
}
