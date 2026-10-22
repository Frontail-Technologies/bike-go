import { buttonVariants } from "@heroui/react";
import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Square icon button. Needs an aria-label. */
  iconOnly?: boolean;
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
};

/** A real anchor styled as a HeroUI button, for navigation (never nest a link in a button). */
export function ButtonLink({ href, variant = "primary", size = "md", fullWidth, iconOnly, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} aria-label={rest["aria-label"]} className={buttonVariants({ variant, size, fullWidth, isIconOnly: iconOnly, className })}>
      {children}
    </Link>
  );
}
