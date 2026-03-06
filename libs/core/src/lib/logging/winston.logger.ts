import winston from 'winston';
import fs from 'fs-extra';
import { join } from 'node:path';

// Paths for logs
const combinedLogs = join(process.cwd(), 'logs/combined.log');
const errorLogs = join(process.cwd(), 'logs/error.log');

// Makes sure folder and file for logging exist
fs.ensureFileSync(combinedLogs);
fs.ensureFileSync(errorLogs);

/* eslint-disable @typescript-eslint/no-explicit-any */
const normalizeContext = winston.format((info: any) => {
    if (info.context) {
        info.context = typeof info.context === 'string'? 
            info.context : info.context.name ?? String(info.context);
    }
    return info;
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// Base logger to be used in place of nest default logger
export const baseLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        normalizeContext(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({filename: 'logs/combined.log'}),
        new winston.transports.File({filename: 'logs/error.log', level: 'error'})
    ]
});
