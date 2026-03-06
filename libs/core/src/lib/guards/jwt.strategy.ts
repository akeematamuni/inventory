import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config';

/*
Utilizing PassportStrategy to extract token from header.
Token is validated and payload content is extracted and attached to request.
Guard needs this strategy to get the data attached to request and update context.
*/

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secretOrKey = configService.get<string>('JWT_SECRET') as string;

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey
        });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    override async validate(payload: any) {
        /* eslint-enable @typescript-eslint/no-explicit-any */
        return {
            userId: payload.userId,
            email: payload.email
        }
    }
}
