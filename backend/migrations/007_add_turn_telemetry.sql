ALTER TABLE thread_posts ADD COLUMN tx_hash VARCHAR(66);
ALTER TABLE thread_posts ADD COLUMN duration_ms INTEGER;
ALTER TABLE thread_posts ADD COLUMN prompt_tokens INTEGER;
ALTER TABLE thread_posts ADD COLUMN completion_tokens INTEGER;
ALTER TABLE thread_posts ADD COLUMN total_tokens INTEGER;

ALTER TABLE verdicts ADD COLUMN tx_hash VARCHAR(66);
ALTER TABLE verdicts ADD COLUMN duration_ms INTEGER;
ALTER TABLE verdicts ADD COLUMN prompt_tokens INTEGER;
ALTER TABLE verdicts ADD COLUMN completion_tokens INTEGER;
ALTER TABLE verdicts ADD COLUMN total_tokens INTEGER;
