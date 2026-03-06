import { Body, BadRequestException, ValidationPipe as NestValidationPipe } from "@nestjs/common";
import { ValidationError } from "class-validator";
import { formatErrors } from "../validation";

/** 
 * Leverage custom decoration to validate DTOs to avoid failing validation due to metadata stripping.
 * Takes a mandatory DTO class to validate against.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
export const ManualBody = (type: any) => Body(new NestValidationPipe({
    whitelist: true,
    transform: true,
    expectedType: type,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
            message: 'Validation Error For Request Body',
            error: formatErrors(errors)
        });
    }
}));
/* eslint-enable @typescript-eslint/no-explicit-any */
