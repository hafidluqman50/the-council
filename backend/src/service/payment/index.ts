import { env } from "../../config/env";
import { buildPaymentGateway } from "./PaymentGateway";

export const paymentGateway = buildPaymentGateway({
  facilitatorUrl: env.payment.facilitatorUrl,
  relayerAddress: env.payment.relayerAddress,
  payToAddress: env.payment.payToAddress,
  assetAddress: env.payment.assetAddress,
  priceAtomic: env.payment.priceAtomic,
});

export type { PaymentGateResult } from "./PaymentGateway";
export type { PaymentPayload } from "./FacilitatorClient";
