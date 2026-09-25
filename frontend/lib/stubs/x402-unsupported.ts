const unsupported = (): never => {
  throw new Error(
    "Coinbase x402 does not support BNB Chain. The Council settles payments through the b402 rail.",
  );
};

export const x402Client = unsupported;
export const x402HTTPClient = unsupported;
export const x402ResourceServer = unsupported;
export const x402HTTPResourceServer = unsupported;
export const HTTPFacilitatorClient = unsupported;

export const toClientEvmSigner = unsupported;
export const ExactEvmScheme = unsupported;
export const ExactSvmScheme = unsupported;
export const UptoEvmScheme = unsupported;
export const UptoSvmScheme = unsupported;
export const createExactEvmScheme = unsupported;
export const createExactSvmScheme = unsupported;
export const registerExactEvmScheme = unsupported;
export const registerExactSvmScheme = unsupported;

export const wrapFetchWithPayment = unsupported;
export const paymentMiddlewareFromConfig = unsupported;
export const paymentMiddlewareFromHTTPServer = unsupported;
export const bazaarResourceServerExtension = unsupported;

export const PaymentRequirementsV1Schema = {};
export const PaymentRequirementsV2Schema = {};

const stub = {};

export default stub;
