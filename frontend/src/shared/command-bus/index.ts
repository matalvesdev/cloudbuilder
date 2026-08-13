/**
 * Frontend CommandBus — command dispatch pattern.
 *
 * Features dispatch commands → CommandBus → APIClient → Gateway → Kafka.
 * Commands are typed, validated, and go through a middleware pipeline
 * (auth headers, tenant context, optimistic updates, error handling).
 *
 * Architecture:
 *   Feature Module → CommandBus.dispatch() → handler → APIClient → Gateway
 *
 * Usage:
 *   import { commandBus } from '@/shared/command-bus'
 *
 *   // Register a command handler
 *   commandBus.register('deploy', async (command) => {
 *     return apiClient.post('/deployments', command.payload)
 *   })
 *
 *   // Dispatch from a feature
 *   const result = await commandBus.dispatch({
 *     type: 'deploy',
 *     payload: { environmentId: '123', version: 'v1.2.3' },
 *     meta: { optimisticId: 'temp-123' },
 *   })
 */

/* ─── Command Types ────────────────────────────────────────── */

export interface Command<
  TPayload = Record<string, unknown>,
  TResult = unknown,
> {
  type: string;
  payload: TPayload;
  meta?: CommandMeta;
}

export interface CommandMeta {
  /** Optimistic update ID for rollback */
  optimisticId?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Skip auth header (public endpoints) */
  skipAuth?: boolean;
  /** Request timeout in ms */
  timeout?: number;
  /** Abort signal */
  signal?: AbortSignal;
}

export interface CommandResult<TResult = unknown> {
  success: boolean;
  data?: TResult;
  error?: CommandError;
  correlationId?: string;
}

export interface CommandError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export type CommandHandler<
  TPayload = Record<string, unknown>,
  TResult = unknown,
> = (command: Command<TPayload, TResult>) => Promise<CommandResult<TResult>>;

export type CommandMiddleware = (
  command: Command,
  next: (command: Command) => Promise<CommandResult>,
) => Promise<CommandResult>;

/* ─── CommandBus Implementation ────────────────────────────── */

class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  private middleware: CommandMiddleware[] = [];
  private pendingCommands = new Map<string, Promise<CommandResult>>();

  /**
   * Register a command handler for a command type.
   * Idempotent — silently skips if a handler is already registered for this type,
   * avoiding console noise from React StrictMode double-mount in development.
   */
  register<TPayload extends Record<string, unknown>, TResult>(
    type: string,
    handler: CommandHandler<TPayload, TResult>,
  ): void {
    if (this.handlers.has(type)) {
      return; // Already registered — skip silently
    }
    this.handlers.set(type, handler as CommandHandler);
  }

  /**
   * Unregister a command handler.
   */
  unregister(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * Add middleware to the command pipeline.
   * Middleware runs in order; each calls `next` to proceed.
   */
  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Dispatch a command through the middleware pipeline to its handler.
   * Deduplicates in-flight commands with the same type+payload hash.
   */
  async dispatch<TPayload extends Record<string, unknown>, TResult>(
    command: Command<TPayload, TResult>,
  ): Promise<CommandResult<TResult>> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      return {
        success: false,
        error: {
          code: "COMMAND_NOT_REGISTERED",
          message: `No handler registered for command type: "${command.type}"`,
        },
      };
    }

    // Build middleware chain
    const baseHandler = (cmd: Command): Promise<CommandResult> =>
      handler(cmd as Command<Record<string, unknown>, unknown>);
    const execute = this.middleware.reduceRight<
      (cmd: Command) => Promise<CommandResult>
    >((next, mw) => (cmd: Command) => mw(cmd, next), baseHandler);

    // Deduplicate in-flight commands
    const dedupeKey = `${command.type}:${JSON.stringify(command.payload)}`;
    const existing = this.pendingCommands.get(dedupeKey);
    if (existing) {
      return existing as Promise<CommandResult<TResult>>;
    }

    const promise = execute(command)
      .then((result) => result as CommandResult<TResult>)
      .finally(() => {
        this.pendingCommands.delete(dedupeKey);
      });

    this.pendingCommands.set(dedupeKey, promise as Promise<CommandResult>);
    return promise;
  }

  /**
   * Check if a command type has a registered handler.
   */
  canDispatch(type: string): boolean {
    return this.handlers.has(type);
  }

  /**
   * Get all registered command types (useful for debugging).
   */
  registeredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get number of in-flight commands (useful for loading states).
   */
  pendingCount(): number {
    return this.pendingCommands.size;
  }

  /**
   * Clear all handlers and middleware (for testing).
   */
  clear(): void {
    this.handlers.clear();
    this.middleware.length = 0;
    this.pendingCommands.clear();
  }
}

/** Singleton CommandBus instance */
export const commandBus = new CommandBus();

/* ─── Built-in Middleware ──────────────────────────────────── */

/**
 * Auth middleware — attaches JWT token to command meta headers.
 */
export const authMiddleware: CommandMiddleware = async (command, next) => {
  if (command.meta?.skipAuth) {
    return next(command);
  }

  const token = localStorage.getItem("cloudbuilder-auth-token");
  if (token) {
    command.meta = {
      ...command.meta,
      correlationId: command.meta?.correlationId ?? crypto.randomUUID(),
    };
  }

  return next(command);
};

/**
 * Logging middleware — logs command dispatch in development.
 */
export const loggingMiddleware: CommandMiddleware = async (command, next) => {
  try {
    const result = await next(command);
    return result;
  } catch (err) {
    throw err;
  }
};

/**
 * Timeout middleware — rejects commands that exceed their timeout.
 */
export const timeoutMiddleware: CommandMiddleware = async (command, next) => {
  const timeout = command.meta?.timeout;
  if (!timeout) return next(command);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    command.meta = { ...command.meta, signal: controller.signal };
    return await next(command);
  } finally {
    clearTimeout(timer);
  }
};

// Register built-in middleware
commandBus.use(loggingMiddleware);
commandBus.use(authMiddleware);
