import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BannerWorkspace } from "@/features/admin/banners/components/banner-workspace";

export default function BannersPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.banners" />}><BannerWorkspace /></Suspense>;
}
