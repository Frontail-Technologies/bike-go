import { Elysia } from "elysia";
import { AppError } from "@/libs/api";
import { auth, type Session } from "@/libs/auth";
import { requestMeta } from "./request-meta";

const STAFF = new Set(["admin", "super_admin"]);
const unauthenticated = () => new AppError("AUTH_REQUIRED", 401, "Sign in to continue.");

/** One session lookup per request, shared by the macro's pre-validation check and its typed `derive`. */
const sessions = new WeakMap<Request, Promise<Session | null>>();
const sessionOf = (request: Request) => {
  let found = sessions.get(request);
  if (!found) {
    found = auth.api.getSession({ headers: request.headers });
    sessions.set(request, found);
  }
  return found;
};

/**
 * Authentication for the whole API.
 *
 * - `/api/v1/auth/*` is handed to Better Auth (Google OAuth, Telegram sign-in, session, sign-out).
 * - Route options `auth: true`, `admin: true` and `superAdmin: true` resolve the session from the request cookie,
 *   answer 401/403 in the standard error envelope, and expose a typed `user` and `session` to the handler.
 * - The check runs in the `transform` stage, before body validation, so an anonymous or unauthorised caller gets
 *   401/403 and never learns what the route's schema looks like. `derive` then provides the typed values.
 * - The role always comes from the database through the session, never from a body, query or header.
 */
export const authPlugin = new Elysia({ name: "RideGo.Auth" })
  .use(requestMeta)
  .all(
    "/api/v1/auth/*",
    {
      // Better Auth reads the body itself.
      parse: "none",
      // The individual auth operations are documented from Better Auth's own schema (see plugins/openapi.ts).
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
        const session = await sessionOf(request);
        if (!session) throw unauthenticated();
        if (!STAFF.has(session.user.role as string)) throw new AppError("FORBIDDEN", 403, "This area is for RideGo staff.");
      },
      async derive({ request }) {
        const session = (await sessionOf(request))!;
        return { user: session.user, session: session.session };
      },
    },
    superAdmin: {
      async transform({ request }) {
        const session = await sessionOf(request);
        if (!session) throw unauthenticated();
        if (session.user.role !== "super_admin") throw new AppError("FORBIDDEN", 403, "This action needs a super admin.");
      },
      async derive({ request }) {
        const session = (await sessionOf(request))!;
        return { user: session.user, session: session.session };
      },
    },
  });
