import { pgEnum } from "drizzle-orm/pg-core";
import {
  AccessLevel,
  ApiMethod,
  ApiType,
  FieldType,
} from "@folio/contract/enums";
import { enumToPgEnum } from "../utils/enum-to-pg-enum";

export const fieldTypeEnum = pgEnum("field_type", enumToPgEnum(FieldType));

export const apiMethodEnum = pgEnum("api_method", enumToPgEnum(ApiMethod));

export const apiTypeEnum = pgEnum("api_type", enumToPgEnum(ApiType));

export const accessLevelEnum = pgEnum(
  "access_level",
  enumToPgEnum(AccessLevel),
);
