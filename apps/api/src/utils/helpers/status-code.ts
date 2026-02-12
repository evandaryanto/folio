import type { StatusCode } from "hono/utils/http-status";
import { ErrorCode } from "@/utils/errors/common";

export function getStatusCode(errorCode: string): StatusCode {
  switch (errorCode) {
    case ErrorCode.Unauthorized:
    case ErrorCode.Expired:
      return 401;
    case ErrorCode.Forbidden:
      return 403;
    case ErrorCode.NotFound:
      return 404;
    case ErrorCode.AlreadyExists:
      return 409;
    case ErrorCode.ValidationError:
    case ErrorCode.InvalidOperation:
      return 400;
    default:
      return 500;
  }
}
