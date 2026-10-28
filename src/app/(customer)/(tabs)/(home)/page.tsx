import { HomeView } from "@/features/customer/home/components/home-view";
import { getHomeServerData } from "@/features/customer/home/api/home-server-data";

export default async function HomePage() {
  const data = await getHomeServerData();
  return <HomeView initialData={data} />;
}
