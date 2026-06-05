import { StockTransferEntity, StockTransferStatus } from './stock-transfer.entity';

describe('StockTransferEntity', () => {
    const createProps = {
        sourceWarehouseId: 'WH-A',
        destinationWarehouseId: 'WH-B',
        createdBy: 'admin',
        lines: [{ productId: 'P1', quantityRequested: 10, unitCost: 100 }]
    };

    describe('create', () => {
        it('should throw if source and destination are same', () => {
            expect(
                () => StockTransferEntity.create({ ...createProps, destinationWarehouseId: 'WH-A' })
            ).toThrow();
        });
    });

    describe('Lifecycle State Machine', () => {
        it('should transition PENDING -> DISPATCHED', () => {
            const st = StockTransferEntity.create(createProps);
            st.dispatch();

            expect(st.status).toBe(StockTransferStatus.DISPATCHED);
            expect(st.lines[0].quantityDispatched).toBe(10);
        });

        it('should transition DISPATCHED -> PARTIALLY_RECEIVED -> RECEIVED', () => {
            const st = StockTransferEntity.create(createProps);
            st.dispatch();
            
            st.receiveLines([{ lineId: st.lines[0].id, quantity: 5 }]);
            expect(st.status).toBe(StockTransferStatus.PARTIALLY_RECEIVED);
            
            st.receiveLines([{ lineId: st.lines[0].id, quantity: 5 }]);
            expect(st.status).toBe(StockTransferStatus.RECEIVED);
        });
    });

    describe('State Guards', () => {
        it('should prevent cancelling a DISPATCHED transfer', () => {
            const st = StockTransferEntity.create(createProps);
            st.dispatch();
            
            expect(() => st.cancel()).toThrow();
        });

        it('should prevent receiving stock from PENDING state', () => {
            const st = StockTransferEntity.create(createProps);

            expect(
                () => st.receiveLines([{ lineId: st.lines[0].id, quantity: 1 }])
            ).toThrow();
        });
    });
});
