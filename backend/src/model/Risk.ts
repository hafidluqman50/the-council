import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export type RiskSeverity = "low" | "medium" | "high";

export class Risk extends Model<InferAttributes<Risk>, InferCreationAttributes<Risk>> {
  declare id: CreationOptional<string>;
  declare threadId: string;
  declare ordinal: number;
  declare label: string;
  declare severity: RiskSeverity;
  declare note: string | null;
}

Risk.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    threadId: { type: DataTypes.UUID, allowNull: false, field: "thread_id" },
    ordinal: { type: DataTypes.SMALLINT, allowNull: false },
    label: { type: DataTypes.TEXT, allowNull: false },
    severity: { type: DataTypes.STRING(16), allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "risks",
    modelName: "Risk",
    timestamps: false,
  },
);
