import { ExceptionFilter, Catch, HttpException, HttpStatus, ArgumentsHost, Logger, Injectable, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ContextService } from '../context/context.service';

/*
Handle all errors thrown within the system.
Log and format well constructed response to client.
*/

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
    
    constructor(@Inject(ContextService) private readonly contextService: ContextService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();
        const { method, url } = request;

        const requestId = this.contextService.getRequestId();
        const tenantId = this.contextService.getTenantId();
        const userId = this.contextService.getUserId();

        const isHttpException = exception instanceof HttpException;
        const stack = exception instanceof Error ? exception.stack : undefined;
        const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        // const message = isHttpException && typeof exception.message === 'string' 
        //     ? exception.message : 'Internal server error';

        /* eslint-disable @typescript-eslint/no-explicit-any */
        let message: string | object = 'Internal server error';
        let error: any = undefined;

        if (isHttpException) {
            const res = exception.getResponse();

            if (res && typeof res === 'object') {
                message = (res as any).message || exception.message;
                error = (res as any).error;

            } else {
                message = res
            }
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const logData = { 
            statusCode,
            message,
            error,
            request: { requestId, tenantId, userId, method, url },
            ...(statusCode >= 500 && stack && { stack })
        }

        if (statusCode >= 500) {
            this.logger.error(logData)
        } else if (statusCode >= 400) {
            this.logger.warn(logData)
        } else {
            this.logger.log(logData)
        }

        response.status(statusCode).json({
            statusCode,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }
}
