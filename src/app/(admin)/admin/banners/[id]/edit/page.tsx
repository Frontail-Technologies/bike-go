import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BannerFormPage } from "@/features/admin/banners/components/banner-form";

export const instant = false;

async function EditBanner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BannerFormPage id={id} />;
}

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.bannerForm" />}><EditBanner params={params} /></Suspense>;
}
