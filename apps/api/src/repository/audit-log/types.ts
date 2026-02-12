import type { NewAuditLog } from "@folio/db/schema";

export type CreateAuditLogInput = NewAuditLog;

export interface AuditLogFilter {
  workspaceId: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
