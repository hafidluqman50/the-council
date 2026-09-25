type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const threshold = order[(process.env.LOG_LEVEL as Level) ?? "info"] ?? order.info;

const emit = (level: Level, message: string, fields?: Record<string, unknown>) => {
  if (order[level] < threshold) return;
  process.stdout.write(
    `${JSON.stringify({ ts: new Date().toISOString(), level, message, ...fields })}\n`,
  );
};

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => emit("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => emit("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => emit("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => emit("error", message, fields),
};
