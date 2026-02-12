import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import type { Context } from "hono";
import type { AppError, ServiceResult } from "@/utils/types/result";
import { ErrorCode } from "@/utils/errors/common";

export const toServiceError = <T>(
  error: AppError,
  defaultStatus: StatusCode = 400,
): ServiceResult<T> => ({
  ok: false,
  error: {
    code: error.code,
    message: error.message,
    details: error.details,
  },
  status: defaultStatus,
});

export const toServiceSuccess = <T>(data: T): ServiceResult<T> => ({
  ok: true,
  data,
});

export const toServiceException = <T>(
  e: unknown,
  defaultMessage = "An unexpected error occurred",
  defaultStatus: StatusCode = 500,
): ServiceResult<T> => {
  if (e instanceof Error) {
    return {
      ok: false,
      error: {
        code: ErrorCode.InternalError,
        message: e.message || defaultMessage,
        details: { stack: e.stack },
      },
      status: defaultStatus,
    };
  }

  return {
    ok: false,
    error: {
      code: ErrorCode.InternalError,
      message: defaultMessage,
    },
    status: defaultStatus,
  };
};

export const handleServiceError = <T>(
  c: Context,
  result: Extract<ServiceResult<T>, { ok: false }>,
) => {
  const status = result.status ?? 500;

  return c.json(
    {
      code: result.error.code as ErrorCode,
      message: result.error.message,
      details: result.error.details,
    },
    status as ContentfulStatusCode,
  );
};
