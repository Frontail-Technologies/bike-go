const MIB = 1024 * 1024;

export const UPLOAD_ROUTES = [
  { pattern: /^\/api\/v1\/admin\/vehicles(\/[^/]+)?$/, methods: ["POST", "PATCH"], maxBytes: 55 * MIB },
  { pattern: /^\/api\/v1\/admin\/banners(\/[^/]+)?$/, methods: ["POST", "PATCH"], maxBytes: 6 * MIB },
  { pattern: /^\/api\/v1\/loans\/[^/]+\/documents(\/[^/]+)?$/, methods: ["POST", "PATCH"], maxBytes: 6 * MIB },
] as const;

export const uploadRouteFor = (method: string, path: string) => UPLOAD_ROUTES.find((route) => (route.methods as readonly string[]).includes(method) && route.pattern.test(path));
