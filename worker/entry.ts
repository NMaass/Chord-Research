import worker, { type Env } from "./index";
import { ensureSchema } from "./schema";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      await ensureSchema(env);
    }

    return worker.fetch(request, env);
  },
} satisfies ExportedHandler<Env>;
