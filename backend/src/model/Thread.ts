import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export type ThreadStatus = "LIVE" | "RESOLVED" | "REVISE" | "FAILED";

export class Thread extends Model<InferAttributes<Thread>, InferCreationAttributes<Thread>> {
  declare id: CreationOptional<string>;
  declare publicRef: string;
  declare title: string;
  declare idea: string;
  declare research: string | null;
  declare authorAddress: string;
  declare status: CreationOptional<ThreadStatus>;
  declare consensusScore: number | null;
  declare openedAt: CreationOptional<Date>;
  declare closedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Thread.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    publicRef: { type: DataTypes.STRING(16), allowNull: false, unique: true, field: "public_ref" },
    title: { type: DataTypes.STRING(255), allowNull: false },
    idea: { type: DataTypes.TEXT, allowNull: false },
    research: { type: DataTypes.TEXT, allowNull: true },
    authorAddress: { type: DataTypes.STRING(42), allowNull: false, field: "author_address" },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "LIVE" },
    consensusScore: { type: DataTypes.SMALLINT, allowNull: true, field: "consensus_score" },
    openedAt: { type: DataTypes.DATE, field: "opened_at" },
    closedAt: { type: DataTypes.DATE, allowNull: true, field: "closed_at" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "threads",
    modelName: "Thread",
  },
);
