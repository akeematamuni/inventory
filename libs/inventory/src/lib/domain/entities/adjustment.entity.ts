import { Entity, BaseId } from "@inventory/core/domain";
import { AdjustmentReason } from "../value-objects/adjustment-reason.vo";
import { MovementType } from "../value-objects/movement-type.vo";

export interface AdjustmentProps {
    productId: string;
    warehouseId: string;
    movementType: MovementType;
    unitCost: number;
    quantity: number;
    reason: AdjustmentReason;
    notes?: string | null;
    createdBy: string;
    createdAt: Date;
}

export interface CreateAdjustmentProps {
    productId: string;
    warehouseId: string;
    movementType: MovementType;
    unitCost: number;
    quantity: number;
    reason: AdjustmentReason;
    notes?: string;
    createdBy: string;
}

/**
 * Represents a manual stock correction.
 * Immutable after creation, corrections are new adjustments not edits.
 * Every adjustment carries a mandatory reason for full audit traceability.
*/
export class AdjustmentEntity extends Entity<AdjustmentProps> {
    private constructor(props: AdjustmentProps, id: string) {
        super(props, id);
    }

    public static create(props: CreateAdjustmentProps): AdjustmentEntity {
        const allowedMovements = [MovementType.ADJUSTMENT_UP, MovementType.ADJUSTMENT_DOWN];

        if (!allowedMovements.includes(props.movementType)) {
            throw new Error(
                `Manual adjustment can only be ${MovementType.ADJUSTMENT_UP} or ${MovementType.ADJUSTMENT_DOWN}`
            );
        }

        return new AdjustmentEntity(
            {
                ...props,
                notes: props.notes?.trim() ?? null,
                createdAt: new Date()
            },
            BaseId.generate().value
        );
    }

    public static reconstitute(props: AdjustmentProps, id: string): AdjustmentEntity {
        return new AdjustmentEntity(props, id);
    }

    get productId(): string { return this.props.productId; }
    get warehouseId(): string { return this.props.warehouseId; }
    get movementType(): MovementType { return this.props.movementType; }
    get unitCost(): number { return this.props.unitCost; }
    get quantity(): number { return this.props.quantity; }
    get reason(): AdjustmentReason { return this.props.reason; }
    get notes(): string | null | undefined { return this.props.notes; }
    get createdBy(): string { return this.props.createdBy; }
    get createdAt(): Date { return this.props.createdAt; }
}
