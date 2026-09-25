const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optional = (key: string, fallback: string): string => process.env[key] ?? fallback;

export type AppEnv = "development" | "staging" | "production";

export const env = {
  appEnv: optional("APP_ENV", "development") as AppEnv,
  port: Number(optional("PORT", "8080")),
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:3000").split(",").map((origin) => origin.trim()),

  databaseUrl: optional("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/the_council"),

  llm: {
    provider: optional("LLM_PROVIDER", "deepseek"),
    apiKey: optional("LLM_API_KEY", ""),
    baseUrl: optional("LLM_BASE_URL", ""),
    orchestratorModel: optional("LLM_ORCHESTRATOR_MODEL", "deepseek-v4-pro"),
    panelModel: optional("LLM_PANEL_MODEL", "deepseek-flash"),
    validatorModel: optional("LLM_VALIDATOR_MODEL", "deepseek-flash"),
  },

  tavilyApiKey: optional("TAVILY_API_KEY", ""),

  chain: {
    rpcUrl: optional("BSC_RPC_URL", "https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
    chainId: Number(optional("BSC_CHAIN_ID", "97")),
    identityRegistry: optional("IDENTITY_REGISTRY_ADDRESS", ""),
    reputationRegistry: optional("REPUTATION_REGISTRY_ADDRESS", ""),
    validationRegistry: optional("VALIDATION_REGISTRY_ADDRESS", ""),
    minterPrivateKey: optional("MINTER_PRIVATE_KEY", ""),
    threadRegistry: optional("THREAD_REGISTRY_ADDRESS", ""),
  },

  agentWallets: {
    orc: optional("ORC_PRIVATE_KEY", ""),
    m1: optional("M1_PRIVATE_KEY", ""),
    m2: optional("M2_PRIVATE_KEY", ""),
    m3: optional("M3_PRIVATE_KEY", ""),
    tech: optional("TECH_PRIVATE_KEY", ""),
  },

  payment: {
    enabled: optional("PAYMENT_ENABLED", "false") === "true",
    facilitatorUrl: optional("B402_FACILITATOR_URL", "http://localhost:3402"),
    relayerAddress: optional("B402_RELAYER_ADDRESS", ""),
    payToAddress: optional("B402_PAY_TO_ADDRESS", ""),
    assetAddress: optional("B402_ASSET_ADDRESS", "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"),
    priceAtomic: optional("B402_PRICE_ATOMIC", "1000000000000000000"),
  },

  required,
};
