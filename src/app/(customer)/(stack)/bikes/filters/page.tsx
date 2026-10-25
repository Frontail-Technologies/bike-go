import type { Metadata } from "next";
import { FiltersScreen } from "@/features/customer/vehicles/components/browse/filters-screen";

export const metadata: Metadata = { title: "Filters" };

export default function FiltersPage() {
  return <FiltersScreen />;
}
