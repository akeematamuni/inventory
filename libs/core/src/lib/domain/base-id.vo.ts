import { randomUUID } from 'node:crypto';
import { ValueObject } from './value-object.base';

export interface BaseIdProps {
    value: string;
}

export class BaseId extends ValueObject<BaseIdProps> {
    private static readonly VALID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    private constructor(props: BaseIdProps) {
        super(props);
    }

    public static generate(): BaseId {
        const value = randomUUID();

        if (!this.VALID_PATTERN.test(value)) {
            throw new Error('Tenant ID must be a valid UUID');
        }

        return new BaseId({ value });
    }

    get value(): string {
        return this.props.value;
    }
}
