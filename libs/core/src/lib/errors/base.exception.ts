import { HttpException, HttpStatus } from '@nestjs/common';

// export type ErrorCode = 
//     |'ACCESS_DENIED'
//     |'BAD_REQUEST'
//     |'INTERNAL_SERVER_ERROR'
//     |'NOT_FOUND'
//     |'UNAUTHORIZED'

export class BaseException extends HttpException {
    constructor(
        message: string,
        code = 'INTERNAL_SERVER_ERROR',
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    ) {
        super({ message, code }, statusCode);
    }
}
