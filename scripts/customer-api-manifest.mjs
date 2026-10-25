export const customerApiManifest = [
  {
    domain: "profile",
    featureDir: "src/features/profile",
    keyName: "customerProfileKeys",
    operations: [
      { name: "getProfile", hook: "useCustomerProfileQuery", kind: "query", method: "GET", path: "/me", responseType: "CustomerProfile" },
      { name: "updateProfile", hook: "useUpdateCustomerProfileMutation", kind: "mutation", method: "PATCH", path: "/me", bodyType: "CustomerProfileUpdate", responseType: "CustomerProfile", invalidate: true },
    ],
  },
];
