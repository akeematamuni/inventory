import { CycleCountEntity, CycleCountStatus } from './cycle-count.entity';

describe('CycleCountEntity', () => {
    const createProps = {
        warehouseId: 'wh-001',
        createdBy: 'admin-user',
        lines: [
            { productId: 'prod-A', unitCost: 10, systemQuantity: 100 },
            { productId: 'prod-B', unitCost: 20, systemQuantity: 50 }
        ]
    };

    describe('Lifecycle and State Machine', () => {
        it('should transition to PENDING_APPROVAL when all lines are counted', () => {
            const cc = CycleCountEntity.create(createProps);
            
            cc.submitLines([
                { lineId: cc.lines[0].id, countedQuantity: 100 },
                { lineId: cc.lines[1].id, countedQuantity: 50 }
            ]);

            expect(cc.status).toBe(CycleCountStatus.PENDING_APPROVAL);
        });

        it('should throw when trying to approve an open count', () => {
            const cc = CycleCountEntity.create(createProps);
            expect(() => cc.approve('manager')).toThrow();
        });

        it('should transition to REJECTED and allow moving back through approval cycle', () => {
            const cc = CycleCountEntity.create(createProps);
            
            cc.submitLines(cc.lines.map(l => ({ lineId: l.id, countedQuantity: 0 })));
            cc.reject();
            
            expect(cc.status).toBe(CycleCountStatus.REJECTED);
        });
    });

    describe('Aggregate Boundaries', () => {
        it('should only return lines with variance upon approval', () => {
            const cc = CycleCountEntity.create(createProps);
            
            cc.submitLines([
                { lineId: cc.lines[0].id, countedQuantity: 100 },
                { lineId: cc.lines[1].id, countedQuantity: 40 }
            ]);
            
            const linesToAdjust = cc.approve('manager');
            
            expect(cc.status).toBe(CycleCountStatus.APPROVED);
            expect(linesToAdjust).toHaveLength(1);
            expect(linesToAdjust[0].productId).toBe('prod-B');
        });

        it('should throw if a line submitted does not belong to the aggregate', () => {
            const cc = CycleCountEntity.create(createProps);

            expect(
                () => cc.submitLines([{ lineId: 'invalid-id', countedQuantity: 10 }])
            ).toThrow();
        });
    });
});
