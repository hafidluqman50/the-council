import { Elysia } from "elysia";

import { env } from "../../config/env";
import { success } from "../response/envelope";

export const healthRoutes = new Elysia({ prefix: "/health" }).get("/", () =>
  success({
    status: "ok",
    env: env.appEnv,
    chainId: env.chain.chainId,
    uptimeSeconds: Math.floor(process.uptime()),
  }),
);
