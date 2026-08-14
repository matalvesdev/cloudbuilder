-- ═══════════════════════════════════════════════════════════════════════════
-- CloudBuilder — Event Outbox (Transactional Outbox Pattern)
-- ═══════════════════════════════════════════════════════════════════════════
-- Garante que eventos sejam persistidos antes do processamento assíncrono,
-- prevenindo perda de eventos em caso de crash do JVM entre publish e handle.
--
-- Flow:
--   1. Business operation persiste dados + outbox entry (mesma transação)
--   2. Async @EventListener processa o evento
--   3. OutboxSweeper retry a cada 30s para entries PENDING
--   4. Cleanup apaga entries PROCESSED com > 24h
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS event_outbox (
    id              VARCHAR(36)     PRIMARY KEY,
    event_type      VARCHAR(100)    NOT NULL,
    event_class     VARCHAR(255)    NOT NULL,
    payload         TEXT            NOT NULL,
    tenant_id       VARCHAR(36),
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at    TIMESTAMP,
    retry_count     INT             NOT NULL DEFAULT 0,
    last_error      TEXT
);

-- Index for sweep queries (PENDING + created_at ASC)
CREATE INDEX IF NOT EXISTS idx_event_outbox_status
    ON event_outbox (status, created_at ASC);

-- Index for tenant isolation
CREATE INDEX IF NOT EXISTS idx_event_outbox_tenant
    ON event_outbox (tenant_id);

-- Cleanup index for processed entries
CREATE INDEX IF NOT EXISTS idx_event_outbox_processed
    ON event_outbox (status, processed_at ASC)
    WHERE status = 'PROCESSED';
