CREATE TABLE ai_estimate_sessions (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id),
    created_by BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    initial_request TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    estimate_name VARCHAR(255) NOT NULL DEFAULT '',
    estimate_notes TEXT NOT NULL DEFAULT '',
    questions_json TEXT NOT NULL DEFAULT '[]',
    answers_json TEXT NOT NULL DEFAULT '{}',
    draft_items_json TEXT NOT NULL DEFAULT '[]',
    total_tokens_used BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ai_estimate_sessions_project ON ai_estimate_sessions(project_id);
CREATE INDEX idx_ai_estimate_sessions_created_by ON ai_estimate_sessions(created_by);

CREATE TABLE ai_token_usage_days (
    id BIGSERIAL PRIMARY KEY,
    business_date DATE NOT NULL UNIQUE,
    used_tokens BIGINT NOT NULL DEFAULT 0,
    request_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
