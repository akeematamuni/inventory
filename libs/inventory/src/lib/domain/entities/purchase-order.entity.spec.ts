import { PurchaseOrderEntity, PurchaseOrderStatus } from './purchase-order.entity';
import { PurchaseOrderLineEntity } from './purchase-order-line.entity';

describe('PurchaseOrderEntity', () => {
    const createProps = {
        warehouseId: 'wh-001',
        supplierName: 'Global Supplier',
        createdBy: 'admin-user',
        lines: [
            { productId: 'prod-1', unitCostAtOrder: 10, quantityOrdered: 10 },
            { productId: 'prod-2', unitCostAtOrder: 20, quantityOrdered: 5 }
        ]
    };

    describe('create', () => {
        it('should initialize with DRAFT status and correctly map lines', () => {
            const po = PurchaseOrderEntity.create(createProps);
            
            expect(po.status).toBe(PurchaseOrderStatus.DRAFT);
            expect(po.lines).toHaveLength(2);
            expect(po.lines[0]).toBeInstanceOf(PurchaseOrderLineEntity);
            expect(po.lines[0].purchaseOrderId).toBe(po.id);
        });

        it('should throw if creating with zero lines', () => {
            expect(() => PurchaseOrderEntity.create({ ...createProps, lines: [] })).toThrow();
        });
    });

    describe('State Machine Transitions', () => {
        it('should transition from DRAFT to OPEN on confirm()', () => {
            const po = PurchaseOrderEntity.create(createProps);
            po.confirm();

            expect(po.status).toBe(PurchaseOrderStatus.OPEN);
        });

        it('should transition to PARTIALLY_RECEIVED then RECEIVED', () => {
            const po = PurchaseOrderEntity.create(createProps);
            po.confirm();

            po.recieveLines([{ lineId: po.lines[0].id, quantity: 5 }]);
            expect(po.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
            expect(po.lines[0].quantityReceived).toBe(5);

            po.recieveLines([
                { lineId: po.lines[0].id, quantity: 5 },
                { lineId: po.lines[1].id, quantity: 5 }
            ]);
            expect(po.status).toBe(PurchaseOrderStatus.RECEIVED);
        });
    });

    describe('Invariant & Guard Rails', () => {
        it('should prevent operations on DRAFT orders', () => {
            const po = PurchaseOrderEntity.create(createProps);
            expect(() => po.recieveLines([{ lineId: po.lines[0].id, quantity: 1 }])).toThrow();
        });

        it('should prevent cancelling a RECEIVED order', () => {
            const po = PurchaseOrderEntity.create(createProps);

            po.confirm();
            po.recieveLines([
                { lineId: po.lines[0].id, quantity: 10 },
                { lineId: po.lines[1].id, quantity: 5 }
            ]);

            expect(() => po.cancel()).toThrow();
        });

        it('should throw when referencing a line ID not belonging to the PO', () => {
            const po = PurchaseOrderEntity.create(createProps);
            po.confirm();
            
            expect(() => po.recieveLines([{ lineId: 'fake-id', quantity: 1 }])).toThrow();
        });
    });
});
