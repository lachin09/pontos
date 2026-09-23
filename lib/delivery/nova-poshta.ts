export interface NovaPostDivision {
  id: number;
  name: string;
  shortName: string;
  number: string;
  countryCode: string;
  city: string;
  address: string;
  category: string;
}

const API_URL = "https://api.novapost.com/v.1.0";
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const key = process.env.NOVA_POSHTA_API_KEY;
  if (!key) throw new Error("not_configured");
  const response = await fetch(`${API_URL}/clients/authorization?apiKey=${encodeURIComponent(key)}`, { cache: "no-store" });
  if (!response.ok) throw new Error("authorization_failed");
  const data: unknown = await response.json();
  const token = typeof data === "string" ? data : (data as { jwt?: string; token?: string; accessToken?: string }).jwt ?? (data as { token?: string; accessToken?: string }).token ?? (data as { accessToken?: string }).accessToken;
  if (!token) throw new Error("authorization_failed");
  cachedToken = { value: token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export async function searchNovaPostDivisions(countryCode: string, city: string) {
  const token = await getToken();
  const url = new URL(`${API_URL}/divisions`);
  url.searchParams.set("countryCodes[]", countryCode);
  url.searchParams.set("limit", "100");
  url.searchParams.set("name", `*${city}*`);
  for (const category of ["PostBranch", "CargoBranch", "Postomat", "PUDO"]) url.searchParams.append("divisionCategories[]", category);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Accept-Language": "uk" }, next: { revalidate: 3600 } });
  if (!response.ok) throw new Error("directory_failed");
  const payload: unknown = await response.json();
  const rows = Array.isArray(payload) ? payload : (payload as { items?: unknown[]; data?: unknown[] }).items ?? (payload as { data?: unknown[] }).data ?? [];
  return rows.flatMap((entry): NovaPostDivision[] => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const id = Number(row.id ?? row.divisionId);
    const category = String(row.divisionCategory ?? row.category ?? "");
    if (!Number.isSafeInteger(id) || (row.status && row.status !== "Working")) return [];
    const settlement = row.settlement && typeof row.settlement === "object" ? row.settlement as Record<string, unknown> : {};
    return [{ id, name: String(row.name ?? row.shortName ?? ""), shortName: String(row.shortName ?? row.name ?? ""), number: String(row.number ?? ""), countryCode: String(row.countryCode ?? countryCode), city: String(settlement.name ?? row.city ?? city), address: String(row.address ?? row.addressLine ?? ""), category }];
  });
}
