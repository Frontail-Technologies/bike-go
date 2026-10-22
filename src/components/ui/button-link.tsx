import { buttonVariants } from "@heroui/react";
import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** A real anchor styled as a HeroUI button, for navigation (never nest a link in a button). */
export function ButtonLink({ href, variant = "primary", size = "md", fullWidth, className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonVariants({ variant, size, fullWidth, className })}>
      {children}
    </Link>
  );
}
