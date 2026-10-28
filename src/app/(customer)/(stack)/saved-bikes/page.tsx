import type { Metadata } from "next";
import { SavedBikesView } from "@/features/customer/vehicles/components/saved/saved-bikes-view";

export const metadata: Metadata = { title: "Saved bikes" };

export default function SavedBikesPage() {
  return <SavedBikesView />;
}
