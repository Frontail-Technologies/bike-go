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
  {
    domain: "bookings",
    featureDir: "src/features/bookings",
    keyName: "customerBookingKeys",
    operations: [
      { name: "listAddons", hook: "useBookingAddonsQuery", kind: "query", method: "GET", path: "/addons", responseType: "BookingAddon", array: true },
      { name: "quoteBooking", hook: "useBookingQuoteMutation", kind: "mutation", method: "POST", path: "/bookings/quote", bodyType: "BookingRequest", responseType: "BookingQuote" },
      { name: "listBookings", hook: "useBookingsQuery", kind: "query", method: "GET", path: "/bookings", queryType: "BookingListParams", responseType: "ApiBooking", paginated: true },
      { name: "createBooking", hook: "useCreateBookingMutation", kind: "mutation", method: "POST", path: "/bookings", bodyType: "BookingRequest", responseType: "ApiBooking", idempotency: true, invalidate: true },
      { name: "getBooking", hook: "useBookingQuery", kind: "query", method: "GET", path: "/bookings/:reference", responseType: "ApiBooking" },
      { name: "cancelBooking", hook: "useCancelBookingMutation", kind: "mutation", method: "POST", path: "/bookings/:reference/cancel", bodyType: "BookingCancelInput", responseType: "ApiBooking", invalidate: true },
    ],
  },
  {
    domain: "payments",
    featureDir: "src/features/payments",
    keyName: "customerPaymentKeys",
    operations: [
      { name: "startPayment", hook: "useStartPaymentMutation", kind: "mutation", method: "POST", path: "/bookings/:reference/payments", responseType: "StartedPayment", invalidate: true },
      { name: "getPayment", hook: "usePaymentQuery", kind: "query", method: "GET", path: "/bookings/:reference/payment", responseType: "BookingPayment" },
    ],
  },
  {
    domain: "loans",
    featureDir: "src/features/loans",
    keyName: "customerLoanKeys",
    operations: [
      { name: "listLoans", hook: "useLoansQuery", kind: "query", method: "GET", path: "/loans", queryType: "LoanListParams", responseType: "ApiLoan", paginated: true },
      { name: "createLoan", hook: "useCreateLoanMutation", kind: "mutation", method: "POST", path: "/loans", bodyType: "LoanCreateInput", responseType: "ApiLoan", invalidate: true },
      { name: "getLoan", hook: "useLoanQuery", kind: "query", method: "GET", path: "/loans/:reference", responseType: "ApiLoan" },
      { name: "updateLoan", hook: "useUpdateLoanMutation", kind: "mutation", method: "PATCH", path: "/loans/:reference", bodyType: "LoanUpdateInput", responseType: "ApiLoan", invalidate: true },
      { name: "submitLoan", hook: "useSubmitLoanMutation", kind: "mutation", method: "POST", path: "/loans/:reference/submit", responseType: "ApiLoan", idempotency: true, invalidate: true },
      { name: "resubmitLoan", hook: "useResubmitLoanMutation", kind: "mutation", method: "POST", path: "/loans/:reference/resubmit", responseType: "ApiLoan", invalidate: true },
    ],
  },
  {
    domain: "loan-documents",
    featureDir: "src/features/loans/documents",
    keyName: "customerLoanDocumentKeys",
    operations: [
      { name: "listLoanDocuments", hook: "useLoanDocumentsQuery", kind: "query", method: "GET", path: "/loans/:reference/documents", responseType: "LoanDocument", array: true },
      { name: "uploadLoanDocument", hook: "useUploadLoanDocumentMutation", kind: "mutation", method: "POST", path: "/loans/:reference/documents", bodyType: "LoanDocumentUpload", responseType: "LoanDocument", invalidate: true },
      { name: "replaceLoanDocument", hook: "useReplaceLoanDocumentMutation", kind: "mutation", method: "PATCH", path: "/loans/:reference/documents/:documentId", bodyType: "LoanDocumentReplace", responseType: "LoanDocument", invalidate: true },
      { name: "deleteLoanDocument", hook: "useDeleteLoanDocumentMutation", kind: "mutation", method: "DELETE", path: "/loans/:reference/documents/:documentId", responseType: "DeletedLoanDocument", invalidate: true },
    ],
  },
];
