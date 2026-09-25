import { Elysia } from "elysia";

import { healthRoutes } from "./health";
import { paymentRoutes } from "./payment";
import { threadRoutes } from "./threads";

export const routes = new Elysia().use(healthRoutes).use(threadRoutes).use(paymentRoutes);
