import { BaseId } from './base-id.vo';

describe('BaseId', () => {
    it('should be equal if values are identical', () => {
        const id1 = BaseId.generate();
        const id2 = BaseId.fromString(id1.value); 

        expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal if values are different', () => {
        const id1 = BaseId.generate();
        const id2 = BaseId.generate();

        expect(id1.equals(id2)).toBe(false);
    });

    it('should throw error for invalid UUID patterns', () => {
        expect(() => { BaseId.fromString('invalid-uuid') }).toThrow();
    });
});
