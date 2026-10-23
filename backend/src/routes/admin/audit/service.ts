import { and, count, desc, eq, gte, like, lt } from "drizzle-orm";
import { db } from "@/libs/db";
import { auditLog, user } from "@/libs/db/schema";
import { paginate } from "@/libs/pagination";
import type { AuditGet } from "./types";

export async function listAudit(query: AuditGet["Query"]) {
  const prefix = query.action?.endsWith(".");
  const where = and(
    query.actorId ? eq(auditLog.actorId, query.actorId) : undefined,
    query.action ? (prefix ? like(auditLog.action, `${query.action.replace(/[\\%_]/g, "\\$&")}%`) : eq(auditLog.action, query.action)) : undefined,
    query.resourceType ? eq(auditLog.resourceType, query.resourceType) : undefined,
    query.resourceId ? eq(auditLog.resourceId, query.resourceId) : undefined,
    query.from ? gte(auditLog.createdAt, new Date(query.from)) : undefined,
    query.to ? lt(auditLog.createdAt, new Date(query.to)) : undefined,
  );

  return paginate(query, {
    rows: (page) =>
      db
        .select({ entry: auditLog, actorName: user.name })
        .from(auditLog)
        .leftJoin(user, eq(user.id, auditLog.actorId))
        .where(where)
        .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
        .limit(page.limit)
        .offset(page.offset),
    total: () => db.select({ n: count() }).from(auditLog).where(where),
    map: (rows) =>
      rows.map(({ entry, actorName }) => ({
        id: entry.id,
        createdAt: entry.createdAt.toISOString(),
        actor: entry.actorId ? { id: entry.actorId, name: actorName ?? "Unknown" } : null,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details,
        ip: entry.ip,
      })),
  });
}
