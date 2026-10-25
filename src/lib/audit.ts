import prisma from "@/lib/prisma";

interface LogAuditParams {
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityCode?: string;
  description?: string;
  ipAddress?: string;
}

export async function logAuditEvent(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorName || "Hệ thống",
        actorRole: params.actorRole || "SYSTEM",
        action: params.action,
        entityType: params.entityType || "SYSTEM",
        entityId: params.entityId,
        entityCode: params.entityCode,
        description: params.description || params.action,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error("Lỗi khi ghi Audit Log:", err);
  }
}
