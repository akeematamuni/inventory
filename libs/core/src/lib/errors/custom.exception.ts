import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BadRequestException extends BaseException {
    constructor(message: string, code = 'BAD_REQUEST') {
        super(message, code, HttpStatus.BAD_REQUEST);
    }
}

export class AccessDeniedException extends BaseException {
    constructor(message: string, code = 'ACCESS_DENIED') {
        super(message, code, HttpStatus.FORBIDDEN);
    }
}

export class NotFoundException extends BaseException {
    constructor(message: string, code = 'NOT_FOUND') {
        super(message, code, HttpStatus.NOT_FOUND);
    }
}

export class UnauthorizedException extends BaseException {
    constructor(message: string, code = 'UNAUTHORIZED') {
        super(message, code, HttpStatus.UNAUTHORIZED);
    }
}
