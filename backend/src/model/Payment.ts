import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";

import { sequelize } from "../config/database";

export type PaymentStatus = "pending" | "settled" | "failed";

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<string>;
  declare threadId: string;
  declare payerAddress: string;
  declare asset: string;
  declare amountAtomic: string;
  declare txHash: string | null;
  declare status: CreationOptional<PaymentStatus>;
  declare createdAt: CreationOptional<Date>;
}

Payment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    threadId: { type: DataTypes.UUID, allowNull: false, field: "thread_id" },
    payerAddress: { type: DataTypes.STRING(42), allowNull: false, field: "payer_address" },
    asset: { type: DataTypes.STRING(42), allowNull: false },
    amountAtomic: { type: DataTypes.DECIMAL, allowNull: false, field: "amount_atomic" },
    txHash: { type: DataTypes.STRING(66), allowNull: true, field: "tx_hash" },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "pending" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
  },
  {
    sequelize,
    tableName: "payments",
    modelName: "Payment",
    updatedAt: false,
  },
);
