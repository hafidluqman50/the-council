import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export class PostReference extends Model<InferAttributes<PostReference>, InferCreationAttributes<PostReference>> {
  declare id: CreationOptional<string>;
  declare postId: string;
  declare ordinal: number;
  declare label: string;
  declare url: string | null;
}

PostReference.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    postId: { type: DataTypes.UUID, allowNull: false, field: "post_id" },
    ordinal: { type: DataTypes.SMALLINT, allowNull: false },
    label: { type: DataTypes.TEXT, allowNull: false },
    url: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "post_references",
    modelName: "PostReference",
    timestamps: false,
  },
);
