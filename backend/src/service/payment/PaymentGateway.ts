import { paymentRepository, type PaymentRepository } from "../../repository/PaymentRepository";
import { FacilitatorClient, type PaymentPayload } from "./FacilitatorClient";

export type PaymentGateResult =
  | { ok: true; txHash: string }
  | { ok: false; code: "PAYMENT_INVALID" | "PAYMENT_FAILED" | "PAYMENT_FACILITATOR_UNAVAILABLE"; message: string };

export class PaymentGateway {
  constructor(
    private readonly facilitatorClient: FacilitatorClient,
    private readonly payToAddress: string,
    private readonly assetAddress: string,
    private readonly priceAtomic: string,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  /** On-chain only — verifies and settles the payment, but never touches Postgres.
   * `payments.thread_id` has a hard FK to `threads.id`, so recording the settlement has
   * to wait until the thread row exists — but the on-chain settlement itself must still
   * happen before that row is created, not after. Call `recordSettlement` once the thread
   * row exists. */
  async verifyAndSettle(payment: PaymentPayload): Promise<PaymentGateResult> {
    const authorization = payment.payload.authorization;

    if (authorization.to.toLowerCase() !== this.payToAddress.toLowerCase()) {
      return { ok: false, code: "PAYMENT_INVALID", message: "Payment recipient does not match the treasury address" };
    }
    if (BigInt(authorization.value) < BigInt(this.priceAtomic)) {
      return { ok: false, code: "PAYMENT_INVALID", message: "Payment amount is below the required price" };
    }
    if (payment.token.toLowerCase() !== this.assetAddress.toLowerCase()) {
      return { ok: false, code: "PAYMENT_INVALID", message: "Payment asset is not the accepted token" };
    }

    let verifyResult;
    try {
      verifyResult = await this.facilitatorClient.verify(payment);
    } catch {
      return { ok: false, code: "PAYMENT_FACILITATOR_UNAVAILABLE", message: "Could not reach the payment facilitator" };
    }
    if (!verifyResult.isValid) {
      return {
        ok: false,
        code: "PAYMENT_INVALID",
        message: verifyResult.invalidReason ?? "Payment signature is invalid",
      };
    }

    let settleResult;
    try {
      settleResult = await this.facilitatorClient.settle(payment);
    } catch {
      return { ok: false, code: "PAYMENT_FACILITATOR_UNAVAILABLE", message: "Could not reach the payment facilitator" };
    }
    if (!settleResult.success || !settleResult.transaction) {
      return { ok: false, code: "PAYMENT_FAILED", message: settleResult.errorReason ?? "Payment settlement failed" };
    }

    return { ok: true, txHash: settleResult.transaction };
  }

  recordSettlement(threadId: string, payment: PaymentPayload, txHash: string): Promise<void> {
    return this.paymentRepository
      .createSettled({
        threadId,
        payerAddress: payment.payload.authorization.from,
        asset: payment.token,
        amountAtomic: payment.payload.authorization.value,
        txHash,
      })
      .then(() => undefined);
  }
}

export const buildPaymentGateway = (config: {
  facilitatorUrl: string;
  relayerAddress: string;
  payToAddress: string;
  assetAddress: string;
  priceAtomic: string;
}): PaymentGateway =>
  new PaymentGateway(
    new FacilitatorClient(config.facilitatorUrl, config.relayerAddress),
    config.payToAddress,
    config.assetAddress,
    config.priceAtomic,
    paymentRepository,
  );
