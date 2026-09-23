import { NextResponse } from "next/server";
import { dispatchPendingNotifications } from "@/lib/notifications/dispatch";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dispatchPendingNotifications({ limit: 50 });
  return NextResponse.json({ ok: true });
}
