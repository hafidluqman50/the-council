import { Payment } from "../model";

export class PaymentRepository {
  createSettled(params: {
    threadId: string;
    payerAddress: string;
    asset: string;
    amountAtomic: string;
    txHash: string;
  }): Promise<Payment> {
    return Payment.create({ ...params, status: "settled" });
  }
}

export const paymentRepository = new PaymentRepository();
