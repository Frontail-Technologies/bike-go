import { PageTransition } from "@/components/motion/page-transition";

export default function CustomerTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
