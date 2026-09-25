import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { env } from "../config/env";
import { logger } from "../logger/logger";
import { failure } from "../http/response/envelope";
import { routes } from "../http/routes";

export const createApp = () =>
  new Elysia()
    .use(cors({ origin: env.corsOrigins }))
    .use(swagger({ path: "/docs", documentation: { info: { title: "The Council API", version: "0.1.0" } } }))
    .onError(({ code, error, set }) => {
      logger.error("request failed", { code, error: String(error) });
      set.status = code === "NOT_FOUND" ? 404 : code === "VALIDATION" ? 422 : 500;
      return failure(String(code), error instanceof Error ? error.message : "Internal server error");
    })
    .use(routes);
