import { config } from "../config";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    stage: string;
    requestId?: string;
    userId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    durationMs?: number;
    error?: string;
    stack?: string;
    [key: string]: any;
}

const log = (level: LogLevel, message: string, meta: Partial<LogEntry> = {}) => {
    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        stage: config.stage,
        ...meta,
    };
    // CloudWatch tự parse JSON nếu output là 1 dòng JSON
    console.log(JSON.stringify(entry));
};

export const logger = {
    info: (message: string, meta?: Partial<LogEntry>) => log("INFO", message, meta),
    warn: (message: string, meta?: Partial<LogEntry>) => log("WARN", message, meta),
    error: (message: string, meta?: Partial<LogEntry>) => log("ERROR", message, meta),
    debug: (message: string, meta?: Partial<LogEntry>) => log("DEBUG", message, meta),

    /** Log request/response cycle — dùng trong makeHandler */
    request: (event: any, statusCode: number, durationMs: number, userId?: string) => {
        log("INFO", "HTTP Request", {
            requestId: event.requestContext?.requestId,
            method: event.requestContext?.http?.method,
            path: event.requestContext?.http?.path,
            statusCode,
            durationMs,
            userId,
        });
    },
};
