import type { Metadata } from "next";
import { LoansLanding } from "@/features/customer/loans/components/loans-landing";
import { getPublicBanners } from "@/features/customer/home/api/home-server-data";

export const metadata: Metadata = { title: "Expat loans" };

export default async function LoansPage() {
  const banners = await getPublicBanners("expat_loan");
  return <LoansLanding banner={banners[0]} />;
}
