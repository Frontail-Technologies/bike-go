import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BannerFormPage } from "@/components/admin/banners/banner-form";

export default function NewBannerPage() {
  return <Suspense fallback={<AdminLoadingState label="Loading banner form…" />}><BannerFormPage /></Suspense>;
}
