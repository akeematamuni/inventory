import { ProductEntity } from './product.entity';
import { StockKeepingUnit } from '../value-objects/sku.vo';
import { Money } from '../value-objects/money.vo';
import { BaseId } from '@inventory/core/domain';

describe('ProductEntity', () => {
    const validSku = StockKeepingUnit.create('TOOL-1234');
    const validCost = Money.create(10.50, 'USD');

    const createProps = {
        name: 'Hammer',
        sku: validSku,
        unitCost: validCost,
        description: 'A sturdy steel hammer',
        reorderPoint: 10,
        barcode: '1234567890',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should create a valid product with default active status', () => {
            const product = ProductEntity.create(createProps);

            expect(product.name).toBe('Hammer');
            expect(product.sku.value).toBe('TOOL-1234');
            expect(product.isActive).toBe(true);
            expect(product.reorderPoint).toBe(10);
        });

        it('should throw if name is empty', () => {
            expect(() => ProductEntity.create({ ...createProps, name: '  ' })).toThrow();
        });
    });

    describe('update', () => {
        it('should update product details correctly', () => {
            const product = ProductEntity.create(createProps);
            product.update({ 
                name: 'Super Hammer', 
                unitCost: Money.create(12.99, 'USD') 
            });

            expect(product.name).toBe('Super Hammer');
            expect(product.unitCost.amount).toBe(12.99);
        });
    });

    describe('Activation/Deactivation', () => {
        it('should deactivate and activate the product', () => {
            const product = ProductEntity.create(createProps);
            
            product.deactivate();
            expect(product.isActive).toBe(false);
            
            product.activate();
            expect(product.isActive).toBe(true);
        });

        it('should throw if deactivating already inactive product', () => {
            const product = ProductEntity.create(createProps);
            product.deactivate();

            expect(() => product.deactivate()).toThrow();
        });
    });

    describe('Identity & Reconstitution', () => {
        it('should be equal by ID regardless of state changes', () => {
            const id = BaseId.generate().value;
            const product1 = ProductEntity.reconstitute(
                { 
                    ...createProps, 
                    isActive: true, 
                    createdAt: new Date(), 
                    updatedAt: new Date() 
                }, 
                id
            );
            const product2 = ProductEntity.reconstitute(
                { 
                    ...createProps, 
                    name: 'New Name', 
                    isActive: false, 
                    createdAt: new Date(), 
                    updatedAt: new Date() 
                },
                id
            );
            
            expect(product1.equals(product2)).toBe(true);
        });
    });
});
