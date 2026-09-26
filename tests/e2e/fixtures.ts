import { test as base, expect } from "@playwright/test";

/**
 * Every e2e test runs against the owner's real Supabase data, so nothing may
 * ever be written. This auto fixture:
 *  - aborts any non-GET request to /api/orders (placing an order) and
 *  - aborts every request to /api/admin/*,
 * records each blocked request, and fails the test afterwards if any were
 * attempted, so an accidental order attempt can never pass silently.
 */
type SafetyFixtures = {
  blockedWrites: string[];
};

export const test = base.extend<SafetyFixtures>({
  blockedWrites: [
    // The second argument is Playwright's `use`; it is renamed so the React
    // hooks lint rule does not mistake it for React's `use()`.
    async ({ context }, provide) => {
      const blocked: string[] = [];

      await context.route(
        (url) => url.pathname.startsWith("/api/orders"),
        async (route) => {
          const request = route.request();
          if (request.method() === "GET") {
            await route.continue();
            return;
          }
          blocked.push(`${request.method()} ${request.url()}`);
          await route.abort("blockedbyclient");
        },
      );

      await context.route(
        (url) => url.pathname.startsWith("/api/admin"),
        async (route) => {
          const request = route.request();
          blocked.push(`${request.method()} ${request.url()}`);
          await route.abort("blockedbyclient");
        },
      );

      await provide(blocked);

      expect(
        blocked,
        "A test tried to write to the store (order or admin API). E2E tests must never do that.",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
