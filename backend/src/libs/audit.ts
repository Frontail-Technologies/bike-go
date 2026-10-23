import { clientIp } from "@/libs/client-ip";
import { db } from "@/libs/db";
import { auditLog } from "@/libs/db/schema";

type Context = { user: { id: string }; request: Request; server?: Parameters<typeof clientIp>[1] };
type Subject = { type: string; id?: string | null | undefined; details?: Record<string, unknown> };

export async function audit(context: Context, action: string, subject: Subject) {
  try {
    await db.insert(auditLog).values({
      actorId: context.user.id,
      action,
      resourceType: subject.type,
      resourceId: subject.id ?? null,
      details: subject.details ?? null,
      ip: clientIp(context.request, context.server),
    });
  } catch (error) {
    console.error(`audit log write failed for ${action}`, error instanceof Error ? error.message : error);
  }
}

export const changedFields = (body: object) =>
  Object.entries(body)
    .filter(([, value]) => value !== undefined)
    .map(([name]) => name);
