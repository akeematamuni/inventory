import { z } from 'zod';
import { config } from 'dotenv';
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';

import { configSchema } from './config/config.schema';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './errors/global-exception.filter';
import { JwtGuard } from './guards/jwt.guard';
import { JwtStrategy } from './guards/jwt.strategy';

config();

/*
* Initialize config module to make config service globally available 
* Use factory pattern to make jwt stratgy available for interna passport linking
*/

export const parsed = configSchema.safeParse(process.env);

@Global()
@Module({
    imports: [
        CqrsModule.forRoot(),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ConfigModule.forRoot({
            isGlobal: true, 
            validate: () => {
                if (!parsed.success) {
                    throw new Error(JSON.stringify(z.treeifyError(parsed.error)));
                }
                return parsed.data;
            }
        })
    ],
    providers: [
        JwtGuard,
        GlobalExceptionFilter,
        LoggingInterceptor,
        { provide: APP_GUARD, useExisting: JwtGuard },
        { provide: APP_FILTER, useExisting: GlobalExceptionFilter },
        { provide: APP_INTERCEPTOR, useExisting: LoggingInterceptor },
        {
            provide: JwtStrategy,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secretOrKey = configService.get<string>('JWT_SECRET');
                if (!secretOrKey) {
                    throw new Error('JWT_SECRET is missing!');
                }
                return new JwtStrategy(configService);
            }
        }
    ],
    exports: []
})
export class CoreModule {}
