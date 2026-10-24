import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BannerFormPage } from "@/features/admin/banners/components/banner-form";

export default function NewBannerPage() {
  return <Suspense fallback={<AdminLoadingState label="Loading banner form…" />}><BannerFormPage /></Suspense>;
}
