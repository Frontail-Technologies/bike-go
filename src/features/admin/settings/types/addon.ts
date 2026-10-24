export type Addon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  pricePerDayMinor: number;
  currency: "USD" | "KHR";
  active: boolean;
};

export type AddonCreateInput = { code: string; name: string; description?: string | null; pricePerDayMinor: number; currency: "USD"; active: boolean };
export type AddonUpdateInput = { name?: string; description?: string | null; pricePerDayMinor?: number; active?: boolean };
