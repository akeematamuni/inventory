import { StockLedgerEntryEntity } from './stock-ledger-entry.entity';
import { MovementType } from '../value-objects/movement-type.vo';
import { BaseId } from '@inventory/core/domain';

describe('StockLedgerEntryEntity', () => {
    const createProps = {
        productId: 'prod-123',
        warehouseId: 'wh-001',
        movementType: MovementType.RECEIPT,
        quantityChange: 50,
        balanceAfter: 50,
        referenceId: 'po-999',
        referenceType: 'PURCHASE_ORDER',
        performedBy: 'admin-user',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should create an immutable ledger entry', () => {
            const entry = StockLedgerEntryEntity.create(createProps);
            
            expect(entry.productId).toBe(createProps.productId);
            expect(entry.quantityChange).toBe(50);
            expect(entry.balanceAfter).toBe(50);
            expect(entry.occurredAt).toBeInstanceOf(Date);
        });

        it('should normalize notes', () => {
            const entry = StockLedgerEntryEntity.create({ ...createProps, notes: '  clean note  ' });
            expect(entry.notes).toBe('clean note');
        });
    });

    describe('Immutability & Persistence', () => {
        it('should accurately reconstitute historical data', () => {
            const id = BaseId.generate().value;
            const historicalDate = new Date('2025-01-01T10:00:00Z');
            const props = {
                ...createProps,
                occurredAt: historicalDate,
            };

            const entry = StockLedgerEntryEntity.reconstitute(props, id);
            
            expect(entry.id).toBe(id);
            expect(entry.occurredAt.toISOString()).toBe(historicalDate.toISOString());
        });
    });

    describe('Identity', () => {
        it('should be equal by ID regardless of properties', () => {
            const id = BaseId.generate().value;
            const entry1 = StockLedgerEntryEntity.reconstitute(
                { ...createProps, occurredAt: new Date() }, id
            );
            const entry2 = StockLedgerEntryEntity.reconstitute(
                { ...createProps, quantityChange: 0, occurredAt: new Date() }, id
            );
            
            expect(entry1.equals(entry2)).toBe(true);
        });
    });
});
