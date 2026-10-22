import { notFound } from "next/navigation";
import { AdminUiShowcase } from "@/components/admin/showcase/admin-ui-showcase";

export default function AdminUiPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_ADMIN_UI_SHOWCASE !== "true") notFound();
  return <AdminUiShowcase />;
}
