ALTER TABLE thread_posts DROP COLUMN quote_of_post_id;
ALTER TABLE thread_posts DROP COLUMN quote_who;
ALTER TABLE thread_posts ADD COLUMN quote_of_agent_key VARCHAR(16) REFERENCES agents(agent_key);
