export type CustomerProfile = {
  id: string;
  role: "customer" | "admin" | "super_admin";
  email: string | null;
  fullName: string | null;
  phone: string | null;
  telegramUsername: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  providers: string[];
  profileComplete: boolean;
  missingFields: string[];
};

export type CustomerProfileUpdate = Partial<Pick<CustomerProfile, "fullName" | "phone" | "dateOfBirth" | "nationality" | "address" | "city">>;
