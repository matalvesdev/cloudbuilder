package com.cloudbuilder.observability.infrastructure.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.AppenderBase;
import com.cloudbuilder.observability.domain.service.LogService;
import com.cloudbuilder.observability.application.dto.LogEntryDTO;
import com.cloudbuilder.observability.infrastructure.aop.TraceContext;

import java.time.Instant;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * Async Logback appender that persists logs to PostgreSQL.
 * Buffers entries in-memory and batch-inserts every 500ms or 100 entries.
 * Falls back to stdout if the database is unavailable.
 */
public class PostgresLogAppender extends AppenderBase<ILoggingEvent> {

    private static final int QUEUE_CAPACITY = 10_000;
    private static final int BATCH_SIZE = 100;
    private static final long FLUSH_INTERVAL_MS = 500;

    private final ArrayBlockingQueue<ILoggingEvent> queue = new ArrayBlockingQueue<>(QUEUE_CAPACITY);
    private LogService logService;
    private Thread writerThread;
    private volatile boolean running = true;

    @Override
    public void start() {
        if (logService == null) {
            // Will be set via Spring after appender is configured
        }
        running = true;
        writerThread = new Thread(this::processQueue, "log-writer");
        writerThread.setDaemon(true);
        writerThread.start();
        super.start();
    }

    @Override
    public void stop() {
        running = false;
        if (writerThread != null) {
            writerThread.interrupt();
        }
        super.stop();
    }

    public void setLogService(LogService logService) {
        this.logService = logService;
    }

    @Override
    protected void append(ILoggingEvent event) {
        if (event == null || !queue.offer(event)) {
            // Queue full — fallback to stdout
            System.out.println("[LOG-DROPPED] " + event.getFormattedMessage());
        }
    }

    private void processQueue() {
        while (running) {
            try {
                ILoggingEvent event = queue.poll(FLUSH_INTERVAL_MS, TimeUnit.MILLISECONDS);
                if (event != null) {
                    java.util.List<ILoggingEvent> batch = new java.util.ArrayList<>();
                    batch.add(event);
                    queue.drainTo(batch, BATCH_SIZE - 1);
                    flushBatch(batch);
                } else if (!queue.isEmpty()) {
                    java.util.List<ILoggingEvent> batch = new java.util.ArrayList<>();
                    queue.drainTo(batch, BATCH_SIZE);
                    flushBatch(batch);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("[LOG-WRITER-ERROR] " + e.getMessage());
            }
        }

        // Flush remaining on shutdown
        java.util.List<ILoggingEvent> remaining = new java.util.ArrayList<>();
        queue.drainTo(remaining);
        if (!remaining.isEmpty()) {
            flushBatch(remaining);
        }
    }

    private void flushBatch(java.util.List<ILoggingEvent> batch) {
        if (logService == null || batch.isEmpty()) return;

        try {
            java.util.List<LogEntryDTO> entries = new java.util.ArrayList<>();
            for (ILoggingEvent event : batch) {
                String stackTrace = null;
                IThrowableProxy throwable = event.getThrowableProxy();
                if (throwable != null) {
                    stackTrace = ThrowableProxyUtil.asString(throwable);
                }

                String tenantId = event.getMDCPropertyMap() != null
                    ? event.getMDCPropertyMap().get("tenantId")
                    : null;
                if (tenantId == null) tenantId = "system";

                entries.add(new LogEntryDTO(
                    tenantId,
                    Instant.ofEpochMilli(event.getTimeStamp()),
                    event.getLevel().toString(),
                    event.getLoggerName(),
                    event.getThreadName(),
                    event.getFormattedMessage(),
                    TraceContext.getTraceId(),
                    TraceContext.getSpanId(),
                    stackTrace,
                    "{}"
                ));
            }

            logService.ingestBatch(entries);
        } catch (Exception e) {
            // DB unavailable — fallback to stdout
            for (ILoggingEvent event : batch) {
                System.out.println("[LOG-FALLBACK] " + event.getFormattedMessage());
            }
        }
    }
}
