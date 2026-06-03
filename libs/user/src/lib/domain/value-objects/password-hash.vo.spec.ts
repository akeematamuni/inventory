import { PasswordHash } from './password-hash.vo';

describe('PasswordHash Value Object', () => {
    const validHash = '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/zBsqquCzZ8s6vC1U93Qd5QW5U6';

    describe('create()', () => {
        it('should create a valid PasswordHash', () => {
            const ph = PasswordHash.create(validHash);
            expect(ph.value).toBe(validHash);
        });

        it('should throw error if hash is empty', () => {
            expect(() => PasswordHash.create('')).toThrow('Password hash cannot be empty');
        });

        it('should throw error if hash length is not exactly 60', () => {
            const shortHash = 'too-short';
            expect(() => PasswordHash.create(shortHash)).toThrow('Invalid bcrypt hash format');
        });
    });

    describe('Equality', () => {
        it('should be equal if values are identical', () => {
            const ph1 = PasswordHash.create(validHash);
            const ph2 = PasswordHash.create(validHash);
            expect(ph1.equals(ph2)).toBe(true);
        });

        it('should not be equal if values are different', () => {
            const ph1 = PasswordHash.create(validHash);
            const ph2 = PasswordHash.create('a'.repeat(60));
            expect(ph1.equals(ph2)).toBe(false);
        });
    });
});
