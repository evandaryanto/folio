import { ulid } from "ulid";
import { varchar } from "drizzle-orm/pg-core";

/**
 * Creates a ULID primary key column for Drizzle schemas.
 * ULID is lexicographically sortable (time-based prefix), making it perfect for cursor pagination.
 *
 * @param name - Column name (defaults to "id")
 * @returns Drizzle varchar column configured as ULID primary key
 */
export const ulidPrimaryKey = (name: string = "id") =>
  varchar(name, { length: 26 })
    .primaryKey()
    .$defaultFn(() => ulid());

/**
 * Creates a ULID foreign key column for Drizzle schemas.
 *
 * @param name - Column name
 * @returns Drizzle varchar column configured for ULID foreign key
 */
export const ulidColumn = (name: string) => varchar(name, { length: 26 });

/**
 * ULID validation regex pattern (26 characters, Crockford's base32)
 */
export const ULID_REGEX = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

/**
 * Validates if a string is a valid ULID
 */
export const isValidUlid = (value: string): boolean => ULID_REGEX.test(value);

/**
 * Generates a new ULID
 */
export const generateUlid = (): string => ulid();
