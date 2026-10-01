import { z } from "zod";
import { adminRoute, json, readJson } from "@/lib/http/route";

type Context = RouteContext<"/api/admin/products/[id]/channel-post">;

const postSchema = z.object({
  /** true: the "post to the channel" button; false: the check after a save. */
  force: z.boolean(),
});

export const POST = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id } = await params;
    const { force } = await readJson(request, postSchema, {
      message: "Некоректний запит.",
    });
    if (force) {
      await services.channel.post(id);
      return json({ posted: true });
    }
    return json({ posted: await services.channel.announce(id) });
  },
);
