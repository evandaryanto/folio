import type { StatusCode } from "hono/utils/http-status";

export type ResponseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export type ServiceResult<T> =
  | { ok: true; data: T; status?: StatusCode }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
      status: StatusCode;
    };

export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const ok = <T>(data: T): Result<T, never> => ({
  ok: true,
  data,
});

export const err = <E = AppError>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const createError = (
  code: string,
  message: string,
  details?: Record<string, unknown>,
): AppError => ({
  code,
  message,
  details,
});
