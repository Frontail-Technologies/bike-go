import { StackShell } from "@/components/customer/stack-shell";

export default function StackLayout({ children }: { children: React.ReactNode }) {
  return <StackShell>{children}</StackShell>;
}
