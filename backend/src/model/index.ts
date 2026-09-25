import { Agent } from "./Agent";
import { Payment } from "./Payment";
import { PostReference } from "./PostReference";
import { Risk } from "./Risk";
import { Thread } from "./Thread";
import { ThreadPost } from "./ThreadPost";
import { Verdict } from "./Verdict";

export type { ThreadStatus } from "./Thread";
export type { RiskSeverity } from "./Risk";
export type { PaymentStatus } from "./Payment";

Thread.hasMany(ThreadPost, { foreignKey: "threadId", as: "posts" });
ThreadPost.belongsTo(Thread, { foreignKey: "threadId", as: "thread" });

ThreadPost.belongsTo(Agent, { foreignKey: "agentKey", targetKey: "agentKey", as: "agent" });
ThreadPost.hasMany(PostReference, { foreignKey: "postId", as: "references" });
PostReference.belongsTo(ThreadPost, { foreignKey: "postId", as: "post" });

Thread.hasOne(Verdict, { foreignKey: "threadId", as: "verdict" });
Verdict.belongsTo(Thread, { foreignKey: "threadId", as: "thread" });

Thread.hasMany(Risk, { foreignKey: "threadId", as: "risks" });
Risk.belongsTo(Thread, { foreignKey: "threadId", as: "thread" });

Thread.hasMany(Payment, { foreignKey: "threadId", as: "payments" });
Payment.belongsTo(Thread, { foreignKey: "threadId", as: "thread" });

export { Agent, Payment, PostReference, Risk, Thread, ThreadPost, Verdict };
