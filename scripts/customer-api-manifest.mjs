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
  {
    domain: "banners",
    featureDir: "src/features/home",
    keyName: "customerBannerKeys",
    operations: [
      { name: "listBanners", hook: "useBannersQuery", kind: "query", method: "GET", path: "/banners", queryType: "BannerListParams", responseType: "PublicBanner", array: true },
    ],
  },
  {
    domain: "locations",
    featureDir: "src/features/locations",
    keyName: "customerLocationKeys",
    operations: [
      { name: "listLocations", hook: "useLocationsQuery", kind: "query", method: "GET", path: "/locations", queryType: "LocationListParams", responseType: "CustomerLocation", array: true },
    ],
  },
  {
    domain: "master-data",
    featureDir: "src/features/master-data",
    keyName: "customerMasterDataKeys",
    operations: [
      { name: "listMasterItems", hook: "useMasterItemsQuery", kind: "query", method: "GET", path: "/master-data/:kind", responseType: "MasterItem", array: true },
    ],
  },
  {
    domain: "vehicles",
    featureDir: "src/features/vehicles",
    keyName: "customerVehicleKeys",
    operations: [
      { name: "listVehicles", hook: "useVehiclesQuery", kind: "query", method: "GET", path: "/vehicles", queryType: "VehicleListParams", responseType: "Vehicle", paginated: true },
      { name: "getVehicle", hook: "useVehicleQuery", kind: "query", method: "GET", path: "/vehicles/:idOrSlug", responseType: "Vehicle" },
      { name: "getVehicleAvailability", hook: "useVehicleAvailabilityQuery", kind: "query", method: "GET", path: "/vehicles/:idOrSlug/availability", queryType: "VehicleAvailabilityParams", responseType: "VehicleAvailability" },
    ],
  },
];
