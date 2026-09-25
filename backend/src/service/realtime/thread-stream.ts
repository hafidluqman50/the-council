import type { Server } from "bun";

let server: Server<unknown> | undefined;

export const registerRealtimeServer = (instance: Server<unknown>): void => {
  server = instance;
};

export type ThreadStreamEvent =
  | { type: "post"; post: Record<string, unknown> }
  | { type: "verdict"; verdict: Record<string, unknown> }
  | { type: "error"; message: string };

export const broadcastToThread = (threadId: string, event: ThreadStreamEvent): void => {
  server?.publish(threadId, JSON.stringify(event));
};
