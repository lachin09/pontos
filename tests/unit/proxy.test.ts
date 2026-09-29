import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { proxy } from "@/proxy";

function request(
  path: string,
  { language, cookie }: { language?: string; cookie?: string } = {},
) {
  const headers = new Headers();
  if (language) headers.set("accept-language", language);
  if (cookie) headers.set("cookie", `${LOCALE_COOKIE}=${cookie}`);
  return new NextRequest(new URL(path, "https://pontos.test"), { headers });
}

const rewriteTarget = (response: Response) =>
  response.headers.get("x-middleware-rewrite");
const location = (response: Response) =>
  response.headers.get("location")?.replace("https://pontos.test", "");
const savedLocale = (response: Response) =>
  response.headers.get("set-cookie")?.match(/pontos-lang=(\w+)/)?.[1];

describe("proxy: storefront languages", () => {
  it("serves plain URLs in Ukrainian", async () => {
    const response = await proxy(
      request("/catalog?size=M", { language: "uk" }),
    );
    expect(rewriteTarget(response)).toBe(
      "https://pontos.test/uk/catalog?size=M",
    );
    expect(location(response)).toBeUndefined();
  });

  it("sends a first-time Russian or English browser to its version", async () => {
    const ru = await proxy(request("/catalog", { language: "ru-RU,ru;q=0.9" }));
    expect(ru.status).toBe(307);
    expect(location(ru)).toBe("/ru/catalog");
    expect(savedLocale(ru)).toBe("ru");

    const en = await proxy(request("/", { language: "en-US" }));
    expect(location(en)).toBe("/en");
  });

  it("follows the remembered choice over the browser language", async () => {
    const response = await proxy(
      request("/catalog", { language: "ru", cookie: "uk" }),
    );
    expect(rewriteTarget(response)).toBe("https://pontos.test/uk/catalog");

    const english = await proxy(request("/cart", { cookie: "en" }));
    expect(location(english)).toBe("/en/cart");
  });

  it("serves prefixed URLs as they are and remembers the language", async () => {
    const response = await proxy(request("/en/product/jacket"));
    expect(location(response)).toBeUndefined();
    expect(rewriteTarget(response)).toBeNull();
    expect(savedLocale(response)).toBe("en");
  });

  it("turns /uk/… into the plain URL and remembers Ukrainian", async () => {
    const response = await proxy(request("/uk/catalog", { cookie: "ru" }));
    expect(location(response)).toBe("/catalog");
    expect(savedLocale(response)).toBe("uk");

    const home = await proxy(request("/uk"));
    expect(location(home)).toBe("/");
  });
});
