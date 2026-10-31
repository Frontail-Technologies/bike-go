"use client";

import { Tabs as HeroTabs } from "@heroui/react";
import { AnimatedSelection, SelectionIndicator } from "@/components/motion/animated-selection";
import { cn } from "@/lib/cn";

export type TabItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  selectedKey?: string;
  defaultSelectedKey?: string;
  onSelectionChange?: (key: string) => void;
  "aria-label": string;
  className?: string;
};

export function Tabs({ items, selectedKey, defaultSelectedKey, onSelectionChange, className, ...props }: TabsProps) {
  return (
    <HeroTabs
      aria-label={props["aria-label"]}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey ?? items[0]?.id}
      onSelectionChange={(key) => onSelectionChange?.(String(key))}
      className={cn("w-full", className)}
    >
      <HeroTabs.ListContainer>
        <AnimatedSelection>
          <HeroTabs.List aria-label={props["aria-label"]}>
            {items.map((item) => (
              <HeroTabs.Tab key={item.id} id={item.id} className="isolate min-h-10 gap-2 font-semibold data-[selected=true]:text-brand-foreground">
                {({ isSelected }) => (
                  <>
                    {isSelected ? <SelectionIndicator className="bg-brand shadow-card" /> : null}
                    {item.icon}
                    {item.label}
                  </>
                )}
              </HeroTabs.Tab>
            ))}
          </HeroTabs.List>
        </AnimatedSelection>
      </HeroTabs.ListContainer>
      {items.map((item) =>
        item.content ? (
          <HeroTabs.Panel key={item.id} id={item.id} className="p-0 pt-4">
            {item.content}
          </HeroTabs.Panel>
        ) : null,
      )}
    </HeroTabs>
  );
}
