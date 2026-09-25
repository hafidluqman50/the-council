import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import type { DebatePost } from "../../state";

export const createQuoteExactPostTool = (postsSoFar: DebatePost[]) =>
  new DynamicStructuredTool({
    name: "quote_exact_post",
    description:
      "Retrieve the exact, verbatim text of a specific prior speaker's post, so a rebuttal can quote it precisely instead of relying on memory.",
    schema: z.object({
      agentKey: z.enum(["orc", "m1", "m2", "m3", "tech"]),
      round: z.union([z.literal(1), z.literal(2)]),
    }),
    func: async ({ agentKey, round }) => {
      const post = postsSoFar.find((candidate) => candidate.agentKey === agentKey && candidate.round === round);
      return post ? post.body : `No post found for ${agentKey} in round ${round}.`;
    },
  });
