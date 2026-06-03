import { TokenPayload } from './token-payload.vo';

describe('TokenPayload Value Object', () => {
    const validProps = {
        userId: 'user-uuid-123',
        email: 'test@example.com',
    };

    describe('create', () => {
        it('should create a valid payload', () => {
            const payload = TokenPayload.create(validProps);

            expect(payload.userId).toBe(validProps.userId);
            expect(payload.email).toBe(validProps.email);
        });

        it('should throw error if userId is missing', () => {
            expect(() => TokenPayload.create({ ...validProps, userId: '' })).toThrow();
        });

        it('should throw error if email is missing', () => {
            expect(() => TokenPayload.create({ ...validProps, email: '' })).toThrow();
        });
    });

    describe('toPlainObject', () => {
        it('should return a plain object representation', () => {
            const payload = TokenPayload.create(validProps);
            const plain = payload.toPlainObject();
            
            expect(plain).toEqual(validProps);
            expect(plain.constructor.name).toBe('Object');
        });
    });

    describe('Equality', () => {
        it('should be equal if userId and email are identical', () => {
            const p1 = TokenPayload.create(validProps);
            const p2 = TokenPayload.create(validProps);
            expect(p1.equals(p2)).toBe(true);
        });

        it('should not be equal if any property differs', () => {
            const p1 = TokenPayload.create(validProps);
            const p2 = TokenPayload.create({ ...validProps, userId: 'different-id' });
            expect(p1.equals(p2)).toBe(false);
        });
    });
});
