import { NextResponse } from "next/server";
import { z } from "zod";
import { DELIVERY_COUNTRIES } from "@/lib/constants/countries";
import { searchNovaPostDivisions } from "@/lib/delivery/nova-poshta";

const querySchema = z.object({ country: z.string().length(2), city: z.string().trim().min(2).max(100) });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ country: url.searchParams.get("country"), city: url.searchParams.get("city") });
  if (!parsed.success || !DELIVERY_COUNTRIES.some((country) => country.code === parsed.data.country)) {
    return NextResponse.json({ error: "Вкажіть країну та місто для пошуку." }, { status: 400 });
  }
  try {
    const results = await searchNovaPostDivisions(parsed.data.country, parsed.data.city);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    if (error instanceof Error && error.message === "not_configured") {
      return NextResponse.json({ error: "Пошук відділень тимчасово недоступний. Оберіть доставку на адресу." }, { status: 503 });
    }
    console.error("Nova Post directory lookup failed");
    return NextResponse.json({ error: "Не вдалося завантажити відділення. Спробуйте пізніше або оберіть адресу." }, { status: 502 });
  }
}
