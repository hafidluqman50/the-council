import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export class Agent extends Model<InferAttributes<Agent>, InferCreationAttributes<Agent>> {
  declare id: CreationOptional<string>;
  declare agentKey: string;
  declare name: string;
  declare role: string;
  declare mandate: string;
  declare agentIdOnchain: string | null;
  declare colourToken: string;
  declare agentUri: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Agent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agentKey: { type: DataTypes.STRING(16), allowNull: false, unique: true, field: "agent_key" },
    name: { type: DataTypes.STRING(100), allowNull: false },
    role: { type: DataTypes.STRING(100), allowNull: false },
    mandate: { type: DataTypes.TEXT, allowNull: false },
    agentIdOnchain: { type: DataTypes.BIGINT, allowNull: true, field: "agent_id_onchain" },
    colourToken: { type: DataTypes.STRING(64), allowNull: false, field: "colour_token" },
    agentUri: { type: DataTypes.TEXT, allowNull: true, field: "agent_uri" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "agents",
    modelName: "Agent",
  },
);
