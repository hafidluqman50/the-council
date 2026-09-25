import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export class ThreadPost extends Model<InferAttributes<ThreadPost>, InferCreationAttributes<ThreadPost>> {
  declare id: CreationOptional<string>;
  declare threadId: string;
  declare agentKey: string;
  declare round: number;
  declare sequence: number;
  declare body: string;
  declare confidence: number | null;
  declare quoteOfAgentKey: string | null;
  declare quoteText: string | null;
  declare txHash: string | null;
  declare durationMs: number | null;
  declare promptTokens: number | null;
  declare completionTokens: number | null;
  declare totalTokens: number | null;
  declare createdAt: CreationOptional<Date>;
}

ThreadPost.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    threadId: { type: DataTypes.UUID, allowNull: false, field: "thread_id" },
    agentKey: { type: DataTypes.STRING(16), allowNull: false, field: "agent_key" },
    round: { type: DataTypes.SMALLINT, allowNull: false },
    sequence: { type: DataTypes.SMALLINT, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    confidence: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    quoteOfAgentKey: { type: DataTypes.STRING(16), allowNull: true, field: "quote_of_agent_key" },
    quoteText: { type: DataTypes.TEXT, allowNull: true, field: "quote_text" },
    txHash: { type: DataTypes.STRING(66), allowNull: true, field: "tx_hash" },
    durationMs: { type: DataTypes.INTEGER, allowNull: true, field: "duration_ms" },
    promptTokens: { type: DataTypes.INTEGER, allowNull: true, field: "prompt_tokens" },
    completionTokens: { type: DataTypes.INTEGER, allowNull: true, field: "completion_tokens" },
    totalTokens: { type: DataTypes.INTEGER, allowNull: true, field: "total_tokens" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
  },
  {
    sequelize,
    tableName: "thread_posts",
    modelName: "ThreadPost",
    updatedAt: false,
  },
);
