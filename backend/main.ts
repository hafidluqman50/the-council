import { createApp } from "./src/app/app";
import { connectDatabase } from "./src/config/database";
import { env } from "./src/config/env";
import { logger } from "./src/logger/logger";
import { registerRealtimeServer } from "./src/service/realtime/thread-stream";

await connectDatabase();

const app = createApp().listen({ port: env.port, hostname: "0.0.0.0" });

if (app.server) {
  registerRealtimeServer(app.server);
}

logger.info("the council api started", {
  port: env.port,
  env: env.appEnv,
  chainId: env.chain.chainId,
});

export type App = typeof app;
