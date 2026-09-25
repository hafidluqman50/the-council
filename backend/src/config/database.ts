import { Sequelize } from "sequelize";

import { env } from "./env";

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    idle: 300_000,
    acquire: 30_000,
  },
});

export const connectDatabase = async (): Promise<void> => {
  await sequelize.authenticate();
};
