import { TabShell } from "@/components/customer/tab-shell";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <TabShell>{children}</TabShell>;
}
