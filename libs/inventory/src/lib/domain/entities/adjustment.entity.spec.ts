import { AdjustmentEntity } from './adjustment.entity';
import { AdjustmentReason, AdjustmentReasonCode } from '../value-objects/adjustment-reason.vo';
import { MovementType } from '../value-objects/movement-type.vo';
import { BaseId } from '@inventory/core/domain';

describe('AdjustmentEntity', () => {
    const validReason = AdjustmentReason.create({
        code: AdjustmentReasonCode.DAMAGE, 
        notes: 'Broken during transit' 
    });
    
    const createProps = {
        productId: 'prod-123',
        warehouseId: 'wh-001',
        movementType: MovementType.ADJUSTMENT_DOWN,
        unitCost: 15.50,
        quantity: 5,
        reason: validReason,
        createdBy: 'user-admin',
    };

    describe('create', () => {
        it('should create a valid manual adjustment', () => {
            const adj = AdjustmentEntity.create(createProps);

            expect(adj.movementType).toBe(MovementType.ADJUSTMENT_DOWN);
            expect(adj.quantity).toBe(5);
            expect(adj.reason.code).toBe(AdjustmentReasonCode.DAMAGE);
            expect(adj.createdAt).toBeInstanceOf(Date);
        });

        it('should throw error if movement type is not an adjustment', () => {
            expect(() => {
                AdjustmentEntity.create({ ...createProps, movementType: MovementType.RECEIPT })
            }).toThrow();
        });

        it('should normalize notes string', () => {
            const adj = AdjustmentEntity.create({ ...createProps, notes: '  extra info  ' });
            expect(adj.notes).toBe('extra info');
        });
    });

    describe('Identity & Reconstitution', () => {
        it('should maintain immutability and identity after reconstitution', () => {
            const id = BaseId.generate().value;
            const props = {
                ...createProps,
                notes: 'Historical record',
                createdAt: new Date('2026-03-02'),
            };

            const adj = AdjustmentEntity.reconstitute(props, id);
            
            expect(adj.id).toBe(id);
            expect(adj.createdAt.getFullYear()).toBe(2026);
        });

        it('should be equal by ID regardless of historical content', () => {
            const id = BaseId.generate().value;
            const adj1 = AdjustmentEntity.reconstitute(
                { ...createProps, createdAt: new Date() }, id
            );
            const adj2 = AdjustmentEntity.reconstitute(
                { ...createProps, quantity: 999, createdAt: new Date() }, id
            );
            
            expect(adj1.equals(adj2)).toBe(true);
        });
    });
});
