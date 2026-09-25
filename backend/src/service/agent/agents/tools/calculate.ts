import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const OperationSchema = z.object({
  a: z.number(),
  operation: z.enum(["add", "subtract", "multiply", "divide", "percentOf"]),
  b: z.number(),
});

const runOperation = ({ a, operation, b }: z.infer<typeof OperationSchema>): string => {
  switch (operation) {
    case "add":
      return String(a + b);
    case "subtract":
      return String(a - b);
    case "multiply":
      return String(a * b);
    case "divide":
      return b === 0 ? "Error: division by zero" : String(a / b);
    case "percentOf":
      return String((a / 100) * b);
  }
};

export const createCalculateTool = () =>
  new DynamicStructuredTool({
    name: "calculate",
    description:
      "Perform exact arithmetic. Use this instead of computing a number in your head whenever you are about to state a quantitative claim — a fee, a break-even raise size, a cost comparison. " +
      "Put every calculation you need this turn into the operations array and call this once — one call with 5 operations costs the same turn budget as one call with 1, but 5 separate calls costs 5x.",
    schema: z.object({ operations: z.array(OperationSchema).min(1) }),
    func: async ({ operations }) => JSON.stringify(operations.map(runOperation)),
  });
