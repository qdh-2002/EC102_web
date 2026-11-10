import { prisma } from "./db";

export async function audit(userId: string, action: string, entity: string, entityId = "", summary = "") {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, summary: summary.slice(0, 300) } });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
