ALTER TABLE threads DROP CONSTRAINT threads_status_check;
ALTER TABLE threads ADD CONSTRAINT threads_status_check CHECK (status IN ('LIVE', 'MINTED', 'REVISE', 'FAILED'));
