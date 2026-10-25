import { CustomerQueryProvider } from "@/components/customer/customer-query-provider";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerQueryProvider>{children}</CustomerQueryProvider>;
}
