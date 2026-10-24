import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BannerFormPage } from "@/components/admin/banners/banner-form";

export const instant = false;

async function EditBanner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BannerFormPage id={id} />;
}

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading banner form…" />}><EditBanner params={params} /></Suspense>;
}
