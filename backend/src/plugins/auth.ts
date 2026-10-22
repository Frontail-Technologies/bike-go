import { Elysia } from "elysia";
import { auth } from "@/libs/auth";
import { errorBody } from "@/libs/api";
import { requestMeta } from "./request-meta";

type Role = "customer" | "admin" | "super_admin";
const ADMIN_ROLES: readonly Role[] = ["admin", "super_admin"];

const requestIdOf = (set: { headers: Record<string, unknown> }) => String(set.headers["x-request-id"] ?? crypto.randomUUID());

/**
 * Authentication for the whole API.
 *
 * - `/api/v1/auth/*` is handed to Better Auth (Google OAuth, Telegram sign-in, session, sign-out).
 * - Route options `auth: true`, `admin: true` and `superAdmin: true` resolve the session from the request cookie
 *   and expose a typed `user` and `session` to the handler, or answer 401/403 in the standard error envelope.
 * - The role always comes from the database through the session, never from a body, query or header.
 */
export const authPlugin = new Elysia({ name: "RideGo.Auth" })
  .use(requestMeta)
  .all(
    "/api/v1/auth/*",
    {
      // Better Auth reads the body itself.
      parse: "none",
      detail: { tags: ["Auth"], summary: "Better Auth endpoints (Google OAuth, Telegram sign-in, session, sign-out)" },
    },
    ({ request }) => auth.handler(request),
  )
  .macro({
    auth: {
      async derive({ request, status, set }) {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return status(401, errorBody("AUTH_REQUIRED", "Sign in to continue.", requestIdOf(set)));
        return { user: session.user, session: session.session };
      },
    },
    admin: {
      async derive({ request, status, set }) {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return status(401, errorBody("AUTH_REQUIRED", "Sign in to continue.", requestIdOf(set)));
        if (!ADMIN_ROLES.includes(session.user.role as Role)) return status(403, errorBody("FORBIDDEN", "This area is for RideGo staff.", requestIdOf(set)));
        return { user: session.user, session: session.session };
      },
    },
    superAdmin: {
      async derive({ request, status, set }) {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return status(401, errorBody("AUTH_REQUIRED", "Sign in to continue.", requestIdOf(set)));
        if (session.user.role !== "super_admin") return status(403, errorBody("FORBIDDEN", "This action needs a super admin.", requestIdOf(set)));
        return { user: session.user, session: session.session };
      },
    },
  });
