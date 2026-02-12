import type { Context } from "hono";

export interface SessionData {
  userId: number;
  companyId: string;
  email: string;
  role: string;
}

const IDENTITY_KEY = "identity";

export function setIdentity(c: Context, identity: SessionData): void {
  c.set(IDENTITY_KEY, identity);
}

export function getIdentity(c: Context): SessionData | undefined {
  return c.get(IDENTITY_KEY);
}
