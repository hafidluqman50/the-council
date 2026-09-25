import { Annotation } from "@langchain/langgraph";

import type { DebatePost, Verdict } from "./state";

export const CouncilStateAnnotation = Annotation.Root({
  idea: Annotation<string>,
  research: Annotation<string>,
  posts: Annotation<DebatePost[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  verdict: Annotation<Verdict | undefined>,
});

export type CouncilState = typeof CouncilStateAnnotation.State;
