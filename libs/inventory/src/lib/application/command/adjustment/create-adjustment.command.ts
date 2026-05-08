import { MovementType, AdjustmentReasonCode } from '../../../domain';

export class CreateAdjustmentCommand {
    constructor(
        public readonly productId: string,
        public readonly warehouseId: string,
        public readonly quantity: number,
        public readonly movementType: MovementType,
        public readonly unitCost: number,
        public readonly reasonCode: AdjustmentReasonCode,
        public readonly performedBy: string,
        public readonly notes?: string,
        public readonly reasonNotes?: string,
    ) {}
}
