"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  /** Shown under the title (result count, reference). */
  subtitle?: React.ReactNode;
  /** Mobile back button. Uses history unless `backHref` is given. */
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, showBack = false, backHref, actions, className }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showBack ? (
        <IconButton
          label="Go back"
          icon={<ArrowLeftIcon size={20} />}
          variant="secondary"
          className="-ml-1 md:hidden"
          onPress={() => (backHref ? router.push(backHref) : router.back())}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1>
        {subtitle ? <p className="text-sm text-subtle">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
