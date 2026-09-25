CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key       VARCHAR(16)   NOT NULL UNIQUE,
    name            VARCHAR(100)  NOT NULL,
    role            VARCHAR(100)  NOT NULL,
    mandate         TEXT          NOT NULL,
    agent_id_onchain BIGINT,
    colour_token    VARCHAR(64)   NOT NULL,
    agent_uri       TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE threads (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_ref        VARCHAR(16)   NOT NULL UNIQUE,
    title             VARCHAR(255)  NOT NULL,
    idea              TEXT          NOT NULL,
    research          TEXT,
    author_address    VARCHAR(42)   NOT NULL,
    status            VARCHAR(16)   NOT NULL DEFAULT 'LIVE',
    consensus_score   SMALLINT,
    report_hash       VARCHAR(66),
    token_id          NUMERIC(78,0),
    opened_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    closed_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT threads_status_check CHECK (status IN ('LIVE', 'MINTED', 'REVISE'))
);

CREATE TABLE thread_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID          NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    agent_key       VARCHAR(16)   NOT NULL REFERENCES agents(agent_key),
    round           SMALLINT      NOT NULL,
    sequence        SMALLINT      NOT NULL,
    body            TEXT          NOT NULL,
    confidence      NUMERIC(3,2),
    quote_of_post_id UUID REFERENCES thread_posts(id),
    quote_who       VARCHAR(100),
    quote_text      TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (thread_id, round, sequence)
);

CREATE TABLE post_references (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID          NOT NULL REFERENCES thread_posts(id) ON DELETE CASCADE,
    ordinal     SMALLINT      NOT NULL,
    label       VARCHAR(255)  NOT NULL,
    url         TEXT,
    UNIQUE (post_id, ordinal)
);

CREATE TABLE verdicts (
    thread_id       UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
    status_text     VARCHAR(255)  NOT NULL,
    score           SMALLINT      NOT NULL,
    note            TEXT,
    conclusion      TEXT          NOT NULL,
    unproven_gap    TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE risks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id   UUID          NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    ordinal     SMALLINT      NOT NULL,
    label       VARCHAR(255)  NOT NULL,
    severity    VARCHAR(16)   NOT NULL,
    note        TEXT,
    UNIQUE (thread_id, ordinal),
    CONSTRAINT risks_severity_check CHECK (severity IN ('low', 'medium', 'high'))
);

CREATE TABLE payments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id         UUID          NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    payer_address     VARCHAR(42)   NOT NULL,
    asset             VARCHAR(42)   NOT NULL,
    amount_atomic     NUMERIC(78,0) NOT NULL,
    tx_hash           VARCHAR(66),
    status            VARCHAR(16)   NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT payments_status_check CHECK (status IN ('pending', 'settled', 'failed'))
);

CREATE INDEX idx_thread_posts_thread_id ON thread_posts(thread_id);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_payments_thread_id ON payments(thread_id);
