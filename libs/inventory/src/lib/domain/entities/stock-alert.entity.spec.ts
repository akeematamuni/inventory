import { StockAlertEntity, StockAlertStatus } from './stock-alert.entity';
import { BaseId } from '@inventory/core/domain';

describe('StockAlertEntity', () => {
    const createProps = {
        productId: 'prod-123',
        warehouseId: 'wh-001',
        currentBalance: 5,
        reorderPoint: 10,
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should create an UNRESOLVED alert when balance is low', () => {
            const alert = StockAlertEntity.create(createProps);

            expect(alert.status).toBe(StockAlertStatus.UNRESOLVED);
            expect(alert.createdAt).toBeInstanceOf(Date);
            expect(alert.resolvedAt).toBeUndefined();
        });
    });

    describe('resolve', () => {
        it('should transition to RESOLVED and set resolvedAt', () => {
            const alert = StockAlertEntity.create(createProps);
            const now = new Date();
            jest.setSystemTime(now);

            alert.resolve();

            expect(alert.status).toBe(StockAlertStatus.RESOLVED);
            expect(alert.resolvedAt).toEqual(now);
        });

        it('should throw error if already resolved', () => {
            const alert = StockAlertEntity.create(createProps);
            alert.resolve();

            expect(() => alert.resolve()).toThrow();
        });
    });

    describe('Identity & Reconstitution', () => {
        it('should correctly reconstitute a resolved alert', () => {
            const id = BaseId.generate().value;
            const props = {
                ...createProps,
                status: StockAlertStatus.RESOLVED,
                resolvedAt: new Date(),
                createdAt: new Date(),
            };

            const alert = StockAlertEntity.reconstitute(props, id);

            expect(alert.status).toBe(StockAlertStatus.RESOLVED);
            expect(alert.resolvedAt).toBeDefined();
        });

        it('should be equal by ID regardless of status', () => {
            const id = BaseId.generate().value;
            const alert1 = StockAlertEntity.reconstitute(
                { ...createProps, status: StockAlertStatus.UNRESOLVED, createdAt: new Date() }, id
            );
            const alert2 = StockAlertEntity.reconstitute(
                { ...createProps, status: StockAlertStatus.RESOLVED, createdAt: new Date() }, id
            );
            
            expect(alert1.equals(alert2)).toBe(true);
        });
    });
});
