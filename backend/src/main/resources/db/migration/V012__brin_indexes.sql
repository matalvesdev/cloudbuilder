-- ============================================================
-- BRIN Indexes for Time-Series Tables
-- BRIN (Block Range INdex) is ideal for append-only time-series
-- data that is physically ordered by time (partition key).
-- Significantly smaller than B-tree for range scans.
-- ============================================================

-- ── 1. Metrics ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_metrics_brin_ts
    ON metrics_ts USING BRIN (timestamp)
    WITH (pages_per_range = 32);

-- ── 2. Traces & Spans ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_traces_brin_start
    ON traces USING BRIN (start_time)
    WITH (pages_per_range = 32);

CREATE INDEX IF NOT EXISTS idx_spans_brin_start
    ON spans USING BRIN (start_time)
    WITH (pages_per_range = 32);

-- ── 3. Logs ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_logs_brin_ts
    ON logs USING BRIN (timestamp)
    WITH (pages_per_range = 32);

-- ── 4. Alert Rule Evaluations ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_alert_eval_brin_ts
    ON alert_rule_evaluations USING BRIN (evaluated_at)
    WITH (pages_per_range = 32);
