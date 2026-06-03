import { ValueObject } from "@inventory/core/domain";

export interface EmailProps {
    value: string;
}

export class Email extends ValueObject<EmailProps> {
    private static readonly MAX_LENGTH = 254;
    private static readonly VALID_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    private constructor(props: EmailProps) {
        super(props);
    }

    private static validate(value: string): string {
        const normalized = value.toLowerCase().trim();

        if (!normalized) {
            throw new Error('Email cannot be empty');
        }

        if (!this.VALID_PATTERN.test(normalized)) {
            throw new Error(`This email is invalid or not allowed: ${value}`);
        }

        if (normalized.length > this.MAX_LENGTH) {
            throw new Error(`Email must not exceed ${this.MAX_LENGTH} characters`);
        }

        return normalized;
    }

    public static create(value: string): Email {
        const normalized = this.validate(value);
        return new Email({ value: normalized });
    }

    public static fromTrustedString(value: string): Email {
        // const normalized = this.validate(value);
        // return new Email({ value: normalized });
        return new Email({ value });
    }

    public override toString(): string {
        return this.value;
    }

    get value(): string {
        return this.props.value;
    }

    get domain(): string {
        return this.value.split('@')[1];
    }

    get localStr(): string {
        return this.value.split('@')[0];
    }
}
