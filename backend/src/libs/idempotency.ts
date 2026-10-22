import { and, eq, lt } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Tx } from "@/libs/db";
import { idempotencyKeys } from "@/libs/db/schema";
import { requestHash } from "@/libs/hash";

const TTL_MS = 24 * 60 * 60 * 1000;

export type Idempotent<T> = { status: number; body: T };

/**
 * Runs `run` once per (scope, key). Without a key it simply runs in a transaction. With one:
 *
 * - First call: the key row is inserted in the SAME transaction as the work, then filled with the response.
 *   If the work fails, everything rolls back, the key is not stored, and a retry runs again.
 * - Retry with the same key and the same request: the stored response is returned and nothing runs again.
 * - Retry with the same key but a different request: IDEMPOTENCY_CONFLICT (409).
 * - Two requests racing with one key: the second blocks on the unique index until the first commits, then replays.
 *
 * `scope` should include the user id so keys never collide or leak between users.
 */
export async function idempotently<T>(
  options: { scope: string; key: string | undefined; userId: string; payload: unknown },
  run: (tx: Tx) => Promise<Idempotent<T>>,
): Promise<Idempotent<T> & { replayed: boolean }> {
  const { scope, key, userId, payload } = options;
  if (!key) return { ...(await db.transaction(run)), replayed: false };

  const hash = requestHash(payload);

  for (let attempt = 0; attempt < 2; attempt++) {
    const outcome = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(idempotencyKeys)
        .values({ key, scope, userId, requestHash: hash, expiresAt: new Date(Date.now() + TTL_MS) })
        .onConflictDoNothing({ target: [idempotencyKeys.scope, idempotencyKeys.key] })
        .returning({ id: idempotencyKeys.id });

      if (inserted) {
        const result = await run(tx);
        await tx.update(idempotencyKeys).set({ responseCode: result.status, responseBody: result.body as never }).where(eq(idempotencyKeys.id, inserted.id));
        return { kind: "done" as const, result };
      }

      const [existing] = await tx.select().from(idempotencyKeys).where(and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.key, key))).limit(1);
      if (!existing) return { kind: "retry" as const };
      if (existing.expiresAt < new Date()) {
        await tx.delete(idempotencyKeys).where(and(eq(idempotencyKeys.id, existing.id), lt(idempotencyKeys.expiresAt, new Date())));
        return { kind: "retry" as const };
      }
      if (existing.requestHash !== hash) {
        throw new AppError("IDEMPOTENCY_CONFLICT", 409, "This Idempotency-Key was already used with a different request.");
      }
      if (existing.responseCode === null) return { kind: "retry" as const };
      return { kind: "replay" as const, result: { status: existing.responseCode, body: existing.responseBody as T } };
    });

    if (outcome.kind === "done") return { ...outcome.result, replayed: false };
    if (outcome.kind === "replay") return { ...outcome.result, replayed: true };
  }
  throw new AppError("INTERNAL_ERROR", 500, "Could not complete the request. Please try again.");
}
