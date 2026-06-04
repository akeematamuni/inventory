import { PurchaseOrderLineEntity } from './purchase-order-line.entity';
import { BaseId } from '@inventory/core/domain';

describe('PurchaseOrderLineEntity', () => {
    const lineProps = {
        purchaseOrderId: BaseId.generate().value,
        productId: 'prod-1',
        unitCostAtOrder: 10,
        quantityOrdered: 10,
    };

    it('should initialize with zero received quantity', () => {
        const line = PurchaseOrderLineEntity.create(lineProps);

        expect(line.quantityReceived).toBe(0);
        expect(line.isFullyRecieved).toBe(false);
    });

    it('should track partial receipt correctly', () => {
        const line = PurchaseOrderLineEntity.create(lineProps);
        line.recieve(5);

        expect(line.quantityReceived).toBe(5);
        expect(line.remainingQuantity).toBe(5);
        expect(line.isFullyRecieved).toBe(false);
    });

    it('should flag fully received status', () => {
        const line = PurchaseOrderLineEntity.create(lineProps);
        line.recieve(10);
        
        expect(line.isFullyRecieved).toBe(true);
    });
});
