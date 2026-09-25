import { NextResponse } from "next/server";
import type { z } from "zod";
import {
  AppError,
  badRequest,
  forbidden,
  unauthorized,
  unsupportedMedia,
} from "@/lib/errors";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import {
  createAdminServices,
  type AdminServices,
} from "@/lib/server/admin-services";

/**
 * Route handlers stay thin: read input, call a service, shape the response.
 * Everything cross-cutting — error-to-HTTP mapping, admin auth, body
 * parsing — lives here once instead of in every route.
 */

type Handler<Context> = (
  request: Request,
  context: Context,
) => Promise<Response>;

const UNEXPECTED_ERROR = "Не вдалося виконати дію. Спробуйте пізніше.";

export function route<Context>(handler: Handler<Context>): Handler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error(
        `Unhandled error in ${request.method} ${new URL(request.url).pathname}`,
        error instanceof Error ? error.message : error,
      );
      return NextResponse.json({ error: UNEXPECTED_ERROR }, { status: 500 });
    }
  };
}

type AdminHandler<Context> = (
  request: Request,
  context: Context & { services: AdminServices },
) => Promise<Response>;

/** Like route(), but only for signed-in, active admins. */
export function adminRoute<Context>(
  handler: AdminHandler<Context>,
): Handler<Context> {
  return route(async (request, context) => {
    const session = await getActiveAdminSession();
    if (!session) throw unauthorized();
    return handler(request, {
      ...context,
      services: createAdminServices(session.supabase),
    });
  });
}

/** Rejects cross-site form posts to endpoints that change state. */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw forbidden("Запит не вдалося перевірити.");
  }
}

type ReadJsonOptions = {
  /** Shown when the body is not valid JSON. */
  message: string;
  /** Shown when the JSON fails validation; defaults to `message`. */
  invalidMessage?: string;
  /** Show the validator's own message (schemas carry Ukrainian ones). */
  exposeIssue?: boolean;
  requireJsonContentType?: boolean;
};

/** Parses and validates a JSON body; bad input becomes a 400. */
export async function readJson<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
  {
    message,
    invalidMessage = message,
    exposeIssue = false,
    requireJsonContentType = false,
  }: ReadJsonOptions,
): Promise<z.infer<Schema>> {
  if (
    requireJsonContentType &&
    !request.headers.get("content-type")?.includes("application/json")
  ) {
    throw unsupportedMedia("Некоректний формат запиту.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest(message);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      (exposeIssue && parsed.error.issues[0]?.message) || invalidMessage,
    );
  }
  return parsed.data;
}

export async function readForm(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    throw badRequest("Не вдалося прочитати файл.");
  }
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}
