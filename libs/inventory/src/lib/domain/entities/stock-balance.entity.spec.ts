import { StockBalanceEntity } from './stock-balance.entity';
import { BaseId } from '@inventory/core/domain';

describe('StockBalanceEntity', () => {
    const createProps = {
        productId: 'prod-123',
        warehouseId: 'wh-001',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should initialize a balance of 0', () => {
            const balance = StockBalanceEntity.create(createProps);

            expect(balance.quantity).toBe(0);
            expect(balance.productId).toBe(createProps.productId);
        });
    });

    describe('apply', () => {
        it('should update quantity correctly when adding stock', () => {
            const balance = StockBalanceEntity.create(createProps);

            balance.apply(10);
            expect(balance.quantity).toBe(10);
            
            balance.apply(5);
            expect(balance.quantity).toBe(15);
        });

        it('should update quantity correctly when removing stock', () => {
            const balance = StockBalanceEntity.create(createProps);
            balance.apply(20);
            balance.apply(-10);

            expect(balance.quantity).toBe(10);
        });

        it('should throw error if resulting stock is negative', () => {
            const balance = StockBalanceEntity.create(createProps);
            balance.apply(5);

            expect(() => balance.apply(-6)).toThrow();
        });
    });

    describe('isStockLow', () => {
        it('should return true if quantity is at or below reorder point', () => {
            const balance = StockBalanceEntity.create(createProps);
            balance.apply(5);

            expect(balance.isStockLow(10)).toBe(true);
            expect(balance.isStockLow(5)).toBe(true);
        });

        it('should return false if quantity is above reorder point', () => {
            const balance = StockBalanceEntity.create(createProps);
            balance.apply(11);

            expect(balance.isStockLow(10)).toBe(false);
        });
    });

    describe('Identity & Reconstitution', () => {
        it('should maintain quantity during reconstitution', () => {
            const id = BaseId.generate().value;
            const props = { ...createProps, quantity: 50, updatedAt: new Date() };
            const balance = StockBalanceEntity.reconstitute(props, id);
            
            expect(balance.quantity).toBe(50);
            expect(balance.id).toBe(id);
        });
    });
});
