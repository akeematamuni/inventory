import { Injectable, ExecutionContext, CallHandler, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/*
Logging for request-response cycle.
Helps to trace when and how request flowed and captures the success or failure.
*/

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private logCompletion(startTime: number, method: string, url: string, status: string, err?: any) {
        const duration = performance.now() - startTime;

        const logData = {
            message: `Request ${status}`,
            duration: `${Math.round(duration)}ms`,
            error: err?.message,
            method,
            url
        };

        return status === 'failed' ? this.logger.error(logData) : this.logger.log(logData);
    }
    
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;

        const startTime = performance.now();
        
        this.logger.log({
            message: 'Request started',
            method,
            url,
        });

        return next.handle().pipe(
            tap({
                next: () => this.logCompletion(startTime, method, url, 'completed'),
                error: (err) => this.logCompletion(startTime, method, url, 'failed', err)
            })
        );
    }
}
