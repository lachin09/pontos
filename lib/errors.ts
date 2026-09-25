/**
 * An expected failure with a message that is safe to show the user.
 *
 * Services and repositories throw these; the HTTP layer (lib/http/route.ts)
 * turns them into responses. New kinds of failure need no route changes.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string) => new AppError(message, 400);
export const unauthorized = (message = "Потрібен доступ адміністратора.") =>
  new AppError(message, 401);
export const forbidden = (message: string) => new AppError(message, 403);
export const notFound = (message: string) => new AppError(message, 404);
export const conflict = (message: string) => new AppError(message, 409);
export const unsupportedMedia = (message: string) => new AppError(message, 415);
export const unavailable = (message: string) => new AppError(message, 503);
