import type { DbRecord, NewRecord } from "@folio/db/schema";

export type CreateRecordInput = Omit<
  NewRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateRecordInput = {
  data?: Record<string, unknown>;
  updatedBy?: string;
};

export interface RecordFilter {
  workspaceId: string;
  collectionId: string;
  cursor?: string;
  limit?: number;
}

export type { DbRecord };
