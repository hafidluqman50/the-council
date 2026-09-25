import { Elysia, t } from "elysia";

import { PostReference, Risk, Thread, ThreadPost, Verdict } from "../../model";
import { threadsController } from "../controllers/ThreadsController";

export const threadRoutes = new Elysia({ prefix: "/threads" })
  .post("/", ({ body }) => threadsController.create(body), {
    body: t.Object({
      idea: t.String({ minLength: 1 }),
      research: t.String(),
      authorAddress: t.String({ minLength: 1 }),
      payment: t.Optional(
        t.Object({
          token: t.String(),
          payload: t.Object({
            authorization: t.Object({
              from: t.String(),
              to: t.String(),
              value: t.String(),
              validAfter: t.Number(),
              validBefore: t.Number(),
              nonce: t.String(),
            }),
            signature: t.String(),
          }),
        }),
      ),
    }),
  })
  .get("/", ({ query }) => threadsController.list(query), {
    query: t.Object({ status: t.Optional(t.String()) }),
  })
  .get("/:publicRef", ({ params }) => threadsController.get(params))
  .ws("/:publicRef/stream", {
    async open(ws) {
      const publicRef = (ws.data.params as { publicRef: string }).publicRef;
      const thread = await Thread.findOne({
        where: { publicRef },
        include: [
          { model: ThreadPost, as: "posts", include: [{ model: PostReference, as: "references" }], separate: true, order: [["sequence", "ASC"]] },
          { model: Verdict, as: "verdict" },
          { model: Risk, as: "risks", separate: true, order: [["ordinal", "ASC"]] },
        ],
      });

      if (!thread) {
        ws.send(JSON.stringify({ type: "error", message: "Thread not found" }));
        ws.close();
        return;
      }

      ws.subscribe(thread.id);
      ws.send(JSON.stringify({ type: "replay", thread: thread.get({ plain: true }) }));
    },
  });
