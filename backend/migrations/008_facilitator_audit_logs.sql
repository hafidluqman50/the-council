CREATE TABLE verify_requests (
  id                BIGSERIAL PRIMARY KEY,
  payer             VARCHAR(42) NOT NULL,
  recipient         VARCHAR(42) NOT NULL,
  token             VARCHAR(42) NOT NULL,
  token_symbol      VARCHAR(32),
  amount            NUMERIC(78, 0) NOT NULL,
  amount_formatted  NUMERIC,
  nonce             VARCHAR(66) NOT NULL,
  network           VARCHAR(32),
  chain_id          INTEGER,
  is_valid          BOOLEAN NOT NULL,
  invalid_reason    TEXT,
  duration_ms       INTEGER,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verify_requests_payer ON verify_requests (payer);
CREATE INDEX idx_verify_requests_timestamp ON verify_requests (timestamp DESC);

CREATE TABLE settle_transactions (
  id                    BIGSERIAL PRIMARY KEY,
  transaction_hash      VARCHAR(66),
  payer                 VARCHAR(42) NOT NULL,
  recipient             VARCHAR(42) NOT NULL,
  token                 VARCHAR(42) NOT NULL,
  token_symbol          VARCHAR(32),
  amount                NUMERIC(78, 0) NOT NULL,
  amount_formatted      NUMERIC,
  nonce                 VARCHAR(66) NOT NULL,
  network               VARCHAR(32),
  chain_id              INTEGER,
  block_number          BIGINT,
  gas_used              NUMERIC,
  gas_price             NUMERIC,
  success               BOOLEAN NOT NULL,
  error_reason          TEXT,
  transaction_time_ms   DOUBLE PRECISION,
  total_time_ms         INTEGER,
  timestamp             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settle_transactions_payer ON settle_transactions (payer);
CREATE INDEX idx_settle_transactions_hash ON settle_transactions (transaction_hash);
CREATE INDEX idx_settle_transactions_timestamp ON settle_transactions (timestamp DESC);

ALTER TABLE verify_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settle_transactions ENABLE ROW LEVEL SECURITY;

-- Insert-only: the facilitator writes with the publishable (anon) key, and nothing
-- here grants SELECT/UPDATE/DELETE, so the log can be appended to but not read or altered
-- through the public API. Anyone holding the publishable key can still append rows.
CREATE POLICY facilitator_insert_verify_requests ON verify_requests
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY facilitator_insert_settle_transactions ON settle_transactions
  FOR INSERT TO anon WITH CHECK (true);
