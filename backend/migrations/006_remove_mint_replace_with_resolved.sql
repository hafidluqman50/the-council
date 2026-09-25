ALTER TABLE threads DROP CONSTRAINT threads_status_check;
ALTER TABLE threads ADD CONSTRAINT threads_status_check CHECK (status IN ('LIVE', 'RESOLVED', 'REVISE', 'FAILED'));

UPDATE threads SET status = 'RESOLVED' WHERE status = 'MINTED';

ALTER TABLE threads DROP COLUMN report_hash;
ALTER TABLE threads DROP COLUMN token_id;
