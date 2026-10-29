import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BannerFormPage } from "@/features/admin/banners/components/banner-form";

export default function NewBannerPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.bannerForm" />}><BannerFormPage /></Suspense>;
}
