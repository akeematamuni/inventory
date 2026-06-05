import { CycleCountLineEntity } from './cycle-count-line.entity';
import { BaseId } from '@inventory/core/domain';

describe('CycleCountLineEntity', () => {
    const lineProps = {
        productId: 'prod-A',
        cycleCountId: BaseId.generate().value,
        unitCost: 10,
        systemQuantity: 100
    };

    describe('Initialization', () => {
        it('should initialize with null countedQuantity', () => {
            const line = CycleCountLineEntity.create(lineProps);

            expect(line.countedQuantity).toBeNull();
            expect(line.isCounted()).toBe(false);
        });
    });

    describe('Calculations', () => {
        it('should return null variance when not counted', () => {
            const line = CycleCountLineEntity.create(lineProps);
            
            expect(line.variance()).toBeNull();
            expect(line.hasVariance()).toBe(false);
        });

        it('should calculate variance correctly when counted', () => {
            const line = CycleCountLineEntity.create(lineProps);
            line.submitCount(95); // system: 100, counted: 95
            
            expect(line.variance()).toBe(-5);
            expect(line.hasVariance()).toBe(true);
        });

        it('should report no variance when counts match', () => {
            const line = CycleCountLineEntity.create(lineProps);
            line.submitCount(100);
            
            expect(line.variance()).toBe(0);
            expect(line.hasVariance()).toBe(false);
        });
    });
});
