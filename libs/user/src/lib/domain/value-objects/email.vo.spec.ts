import { Email } from './email.vo';

describe('Email Value Object', () => {
    describe('create()', () => {
        it('should create a valid email', () => {
            const email = Email.create('test@example.com');
            expect(email.value).toBe('test@example.com');
        });

        it('should normalize the email (trim and lowercase)', () => {
            const email = Email.create('  HELLO@WORLD.com  ');
            expect(email.value).toBe('hello@world.com');
        });

        it('should throw error if email is empty', () => {
            expect(() => Email.create('')).toThrow('Email cannot be empty');
        });

        it('should throw error if email is invalid format', () => {
            expect(() => Email.create('invalid-email')).toThrow();
        });

        it('should throw error if email exceeds 254 characters', () => {
            const longEmail = 'a'.repeat(250) + '@test.com';
            expect(() => Email.create(longEmail)).toThrow();
        });
    });

    describe('fromTrustedString()', () => {
        it('should create an instance without re-validating', () => {
            const email = Email.fromTrustedString('trusted@data.com');
            expect(email.value).toBe('trusted@data.com');
        });
    });

    describe('Getters and Helpers', () => {
        const email = Email.create('john.doe@gmail.com');

        it('should return correct domain', () => {
            expect(email.domain).toBe('gmail.com');
        });

        it('should return correct local part', () => {
            expect(email.localStr).toBe('john.doe');
        });

        it('should return string representation', () => {
            expect(email.toString()).toBe('john.doe@gmail.com');
        });
    });

    describe('Equality', () => {
        it('should be equal if values match', () => {
            const email1 = Email.create('test@test.com');
            const email2 = Email.create('test@test.com');
            expect(email1.equals(email2)).toBe(true);
        });

        it('should not be equal if values differ', () => {
            const email1 = Email.create('a@test.com');
            const email2 = Email.create('b@test.com');
            expect(email1.equals(email2)).toBe(false);
        });
    });
});
