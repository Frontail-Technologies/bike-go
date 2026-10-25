export type LocationListParams = { city?: string };

export type CustomerLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
};
