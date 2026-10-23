import { buttonVariants } from "@heroui/react";
import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
};

export function ButtonLink({ href, variant = "primary", size = "md", fullWidth, iconOnly, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} aria-label={rest["aria-label"]} className={buttonVariants({ variant, size, fullWidth, isIconOnly: iconOnly, className })}>
      {children}
    </Link>
  );
}
