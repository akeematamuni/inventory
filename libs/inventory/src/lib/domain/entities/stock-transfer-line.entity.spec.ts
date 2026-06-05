import { StockTransferLineEntity } from './stock-transfer-line.entity';
import { BaseId } from '@inventory/core/domain';

describe('StockTransferLineEntity', () => {
    const lineProps = {
        productId: 'prod-1',
        stockTransferId: BaseId.generate().value,
        quantityRequested: 10,
        unitCost: 5.00,
    };

    it('should initialize with zero dispatched/received quantities', () => {
        const line = StockTransferLineEntity.create(lineProps);
        
        expect(line.quantityDispatched).toBe(0);
        expect(line.quantityReceived).toBe(0);
    });

    it('should calculate variance correctly', () => {
        const line = StockTransferLineEntity.create(lineProps);

        line.dispatch(10);
        line.receive(8);

        expect(line.variance).toBe(2);
    });

    it('should determine full receipt correctly', () => {
        const line = StockTransferLineEntity.create(lineProps);

        line.receive(5);
        expect(line.isFullyReceived).toBe(false);

        line.receive(5);
        expect(line.isFullyReceived).toBe(true);
    });
});
