import { ValueObject } from "@inventory/core/domain";

export interface PasswordHashProps {
    value: string;
}

export class PasswordHash extends ValueObject<PasswordHashProps> {
    private constructor(props: PasswordHashProps) {
        super(props);
    }

    private static validate(value: string): void {
        if (!value) {
            throw new Error('Password hash cannot be empty');
        }

        if (value.length !== 60) {
            throw new Error('Invalid bcrypt hash format');
        }
    }

    public static create(hashedPassword: string): PasswordHash {
        this.validate(hashedPassword);
        return new PasswordHash({ value: hashedPassword });
    }

    get value(): string {
        return this.props.value;
    }
}
