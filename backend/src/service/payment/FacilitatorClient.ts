export type PaymentAuthorization = {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
};

export type PaymentPayload = {
  token: string;
  payload: { authorization: PaymentAuthorization; signature: string };
};

type VerifyResponse = { isValid: boolean; invalidReason?: string; payer?: string };
type SettleResponse = { success: boolean; transaction?: string; errorReason?: string; blockNumber?: number };

export class FacilitatorClient {
  constructor(
    private readonly facilitatorUrl: string,
    private readonly relayerAddress: string,
  ) {}

  private requestBody(payment: PaymentPayload) {
    return {
      paymentPayload: payment,
      paymentRequirements: { relayerContract: this.relayerAddress, network: "bsc-testnet" },
    };
  }

  async verify(payment: PaymentPayload): Promise<VerifyResponse> {
    const response = await fetch(`${this.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(this.requestBody(payment)),
    });
    return (await response.json()) as VerifyResponse;
  }

  async settle(payment: PaymentPayload): Promise<SettleResponse> {
    const response = await fetch(`${this.facilitatorUrl}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(this.requestBody(payment)),
    });
    return (await response.json()) as SettleResponse;
  }
}
