import { RefreshTokenEntity } from './refresh-token.entity';
import { BaseId } from '@inventory/core/domain';

describe('RefreshTokenEntity', () => {
    const validProps = {
        refreshToken: 'secret-token-string',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000)
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a valid non-revoked token', () => {
        const token = RefreshTokenEntity.create(validProps);

        expect(token.isRevoked).toBe(false);
        expect(token.refreshToken).toBe(validProps.refreshToken);
        expect(token.isValid()).toBe(true);
    });

    it('should revoke the token and set revokedAt', () => {
        const token = RefreshTokenEntity.create(validProps);
        const now = new Date();
        jest.setSystemTime(now);

        token.revoke();

        expect(token.isRevoked).toBe(true);
        expect(token.revokedAt).toEqual(now);
        expect(token.isValid()).toBe(false);
    });

    it('should throw error when revoking an already revoked token', () => {
        const token = RefreshTokenEntity.create(validProps);
        token.revoke();

        expect(() => token.revoke()).toThrow('Refresh token already revoked');
    });

    it('should reconstitute correctly from existing data', () => {
        const id = BaseId.generate().value;
        const props = {
            ...validProps,
            isRevoked: true,
            revokedAt: new Date(),
            createdAt: new Date(),
        };
        
        const token = RefreshTokenEntity.reconstitute(props, id);

        expect(token.id).toBe(id);
        expect(token.isRevoked).toBe(true);
        expect(token.revokedAt).toBeDefined();
    });

    it('should correctly identify equality based on entity ID', () => {
        const id = BaseId.generate().value;
        const token1 = RefreshTokenEntity.reconstitute(
            { ...validProps, isRevoked: false, createdAt: new Date() }, id
        );
        const token2 = RefreshTokenEntity.reconstitute(
            { ...validProps, isRevoked: true, createdAt: new Date() }, id
        );
        
        expect(token1.equals(token2)).toBe(true);
    });
});
