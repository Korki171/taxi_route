export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const forbidden = (msg = "Keine Berechtigung für diese Aktion.") =>
  new AppError("FORBIDDEN", msg);
export const notFound = (msg = "Nicht gefunden.") => new AppError("NOT_FOUND", msg);
export const invalid = (msg: string) => new AppError("VALIDATION", msg);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
