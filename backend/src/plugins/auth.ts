import { Elysia } from "elysia";
import { AppError } from "@/libs/api";
import { auth } from "@/libs/auth";
import { requestMeta } from "./request-meta";
import type { Session } from "@/libs/types";

const STAFF = new Set(["admin", "super_admin"]);
const unauthenticated = () => new AppError("AUTH_REQUIRED", 401, "Sign in to continue.");

const sessions = new WeakMap<Request, Promise<Session | null>>();
const freshSessions = new WeakMap<Request, Promise<Session | null>>();

const sessionOf = (request: Request, options: { fresh?: boolean } = {}) => {
  const cache = options.fresh ? freshSessions : sessions;
  let found = cache.get(request);
  if (!found) {
    found = auth.api.getSession({ headers: request.headers, ...(options.fresh ? { query: { disableCookieCache: true } } : {}) });
    cache.set(request, found);
  }
  return found;
};

export const authPlugin = new Elysia({ name: "RideGo.Auth" })
  .use(requestMeta)
  .all(
    "/api/v1/auth/*",
    {
      parse: "none",
      detail: { hide: true },
    },
    ({ request }) => auth.handler(request),
  )
  .macro({
    auth: {
      async transform({ request }) {
        if (!(await sessionOf(request))) throw unauthenticated();
      },
      async derive({ request }) {
        const session = (await sessionOf(request))!;
        return { user: session.user, session: session.session };
      },
    },
    admin: {
      async transform({ request }) {
        const session = await sessionOf(request, { fresh: true });
        if (!session) throw unauthenticated();
        if (!STAFF.has(session.user.role as string)) throw new AppError("FORBIDDEN", 403, "This area is for RideGo staff.");
      },
      async derive({ request }) {
        const session = (await sessionOf(request, { fresh: true }))!;
        return { user: session.user, session: session.session };
      },
    },
    superAdmin: {
      async transform({ request }) {
        const session = await sessionOf(request, { fresh: true });
        if (!session) throw unauthenticated();
        if (session.user.role !== "super_admin") throw new AppError("FORBIDDEN", 403, "This action needs a super admin.");
      },
      async derive({ request }) {
        const session = (await sessionOf(request, { fresh: true }))!;
        return { user: session.user, session: session.session };
      },
    },
  });
