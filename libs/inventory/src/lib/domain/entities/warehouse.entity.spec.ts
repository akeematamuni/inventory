import { WarehouseEntity } from './warehouse.entity';
import { BaseId } from '@inventory/core/domain';

describe('WarehouseEntity (Comprehensive)', () => {
    const validProps = {
        name: 'Main Warehouse',
        code: 'WH001',
        address: '123 Logistics Way',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should create a valid warehouse with default active state', () => {
            const wh = WarehouseEntity.create(validProps);

            expect(wh.name).toBe('Main Warehouse');
            expect(wh.code).toBe('WH001');
            expect(wh.isActive).toBe(true);
        });

        it('should throw error for invalid code format', () => {
            expect(() => WarehouseEntity.create({ ...validProps, code: 'INVALID-CODE' })).toThrow();
            expect(() => WarehouseEntity.create({ ...validProps, code: '1' })).toThrow();
        });

        it('should throw error if name is empty', () => {
            expect(() => WarehouseEntity.create({ ...validProps, name: '  ' })).toThrow();
        });
    });

    describe('update', () => {
        it('should update name and address', () => {
            const wh = WarehouseEntity.create(validProps);
            wh.update('New Name', 'New Address');

            expect(wh.name).toBe('New Name');
            expect(wh.address).toBe('New Address');
        });
    });

    describe('deactivate', () => {
        it('should set isActive to false', () => {
            const wh = WarehouseEntity.create(validProps);
            wh.deactivate();

            expect(wh.isActive).toBe(false);
        });

        it('should throw error if already deactivated', () => {
            const wh = WarehouseEntity.create(validProps);
            wh.deactivate();

            expect(() => wh.deactivate()).toThrow();
        });
    });

    describe('Identity & Equality', () => {
        it('should be equal by ID regardless of properties', () => {
            const id = BaseId.generate().value;
            const wh1 = WarehouseEntity.reconstitute(
                { ...validProps, isActive: true, createdAt: new Date(), updatedAt: new Date() }, id
            );
            const wh2 = WarehouseEntity.reconstitute(
                { 
                    ...validProps, 
                    name: 'Different', 
                    isActive: false, 
                    createdAt: new Date(), 
                    updatedAt: new Date() 
                }, 
                id
            );
            
            expect(wh1.equals(wh2)).toBe(true);
        });
    });
});
