import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '../errors/custom.exception';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    constructor() {
        super();
    }

    /* Check for unprotected routes and skip guard */
    override async canActivate(context: ExecutionContext) {
        const handler = context.getHandler();
        const target = context.getClass();
        
        /* Bypass nestjs core and use Reflect */
        const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, handler) ?? Reflect.getMetadata(IS_PUBLIC_KEY, target);
        if (isPublic) return true;

        const result = (await super.canActivate(context)) as boolean;
        return result;
    }
    
    /* eslint-disable @typescript-eslint/no-explicit-any */
    override handleRequest(err: any, user: any) {
        /* eslint-enable @typescript-eslint/no-explicit-any */
        if (err || !user || !user.tenantId || !user.userId || !user.email) {
            throw new UnauthorizedException('You are not authorized..');
        }
        
        return user;
    }
}
