import { User } from './user.entity';
import { Email } from '../value-objects/email.vo';
import { PasswordHash } from '../value-objects/password-hash.vo';
import { BaseId } from '@inventory/core/domain';

describe('User Entity', () => {
    const validEmail = Email.create('test@example.com');
    const validHash = PasswordHash.create('a'.repeat(60));
    
    const props = {
        email: validEmail,
        passwordHash: validHash,
        firstName: 'John',
        lastName: 'Doe',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize a new user with correct defaults', () => {
        const user = User.create(props);

        expect(user.emailVerified).toBe(false);
        expect(user.verificationToken).toBeDefined();
        expect(user.fullname).toBe('John Doe');
    });

    it('should be equal to another instance if IDs are identical', () => {
        const id = BaseId.generate().value;
        const user1 = User.reconstitute(
            { ...props, createdAt: new Date(), updatedAt: new Date(), emailVerified: false }, id
        );
        const user2 = User.reconstitute(
            { 
                ...props, 
                firstName: 'Updated', 
                createdAt: new Date(), 
                updatedAt: new Date(), 
                emailVerified: false 

            },
            id
        );
        
        expect(user1.equals(user2)).toBe(true);
    });

    it('should verify email successfully', () => {
        const user = User.create(props);
        const token = user.verificationToken;

        user.verifyEmail(token);
        
        expect(user.emailVerified).toBe(true);
        expect(user.verificationToken).toBeUndefined();
    });

    it('should throw if verification token is invalid', () => {
        const user = User.create(props);
        expect(() => user.verifyEmail('wrong-token')).toThrow('Invalid verification token');
    });

    it('should update profile and timestamp', () => {
        const user = User.create(props);
        const initialDate = user.updatedAt;
        
        jest.advanceTimersByTime(1000);
        user.updateProfile('Jane', 'Smith');
        
        expect(user.fullname).toBe('Jane Smith');
        expect(user.updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
    });

    it('should return email as fullname if names are missing', () => {
        const user = User.reconstitute(
            {
                email: validEmail,
                passwordHash: validHash,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }, 
            BaseId.generate().value
        );

        expect(user.fullname).toBe(validEmail.value);
    });

    it('should not allow modification of properties directly', () => {
        const user = User.create(props);
        expect(() => user.updatePassword(PasswordHash.create('b'.repeat(60)))).not.toThrow();
    });
});
