import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export class Verdict extends Model<InferAttributes<Verdict>, InferCreationAttributes<Verdict>> {
  declare threadId: string;
  declare statusText: string;
  declare score: number;
  declare note: string | null;
  declare conclusion: string;
  declare unprovenGap: string | null;
  declare txHash: string | null;
  declare durationMs: number | null;
  declare promptTokens: number | null;
  declare completionTokens: number | null;
  declare totalTokens: number | null;
  declare createdAt: CreationOptional<Date>;
}

Verdict.init(
  {
    threadId: { type: DataTypes.UUID, primaryKey: true, field: "thread_id" },
    statusText: { type: DataTypes.TEXT, allowNull: false, field: "status_text" },
    score: { type: DataTypes.SMALLINT, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    conclusion: { type: DataTypes.TEXT, allowNull: false },
    unprovenGap: { type: DataTypes.TEXT, allowNull: true, field: "unproven_gap" },
    txHash: { type: DataTypes.STRING(66), allowNull: true, field: "tx_hash" },
    durationMs: { type: DataTypes.INTEGER, allowNull: true, field: "duration_ms" },
    promptTokens: { type: DataTypes.INTEGER, allowNull: true, field: "prompt_tokens" },
    completionTokens: { type: DataTypes.INTEGER, allowNull: true, field: "completion_tokens" },
    totalTokens: { type: DataTypes.INTEGER, allowNull: true, field: "total_tokens" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
  },
  {
    sequelize,
    tableName: "verdicts",
    modelName: "Verdict",
    updatedAt: false,
  },
);
