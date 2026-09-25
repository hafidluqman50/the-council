import { Elysia } from "elysia";

import { env } from "../../config/env";
import { success } from "../response/envelope";

export const paymentRoutes = new Elysia({ prefix: "/payment" }).get("/requirements", () =>
  success({
    enabled: env.payment.enabled,
    relayerAddress: env.payment.relayerAddress,
    payToAddress: env.payment.payToAddress,
    assetAddress: env.payment.assetAddress,
    priceAtomic: env.payment.priceAtomic,
    chainId: env.chain.chainId,
  }),
);
