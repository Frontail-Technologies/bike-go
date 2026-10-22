import { PageTransition } from "@/components/motion/page-transition";

export default function TabsTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
