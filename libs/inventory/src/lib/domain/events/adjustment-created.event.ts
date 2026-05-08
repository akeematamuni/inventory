export class AdjustmentCreatedEvent {
    constructor(
        public readonly adjustmentId: string,
        public readonly productId: string,
        public readonly warehouseId: string,
        public readonly quantity: number,
        public readonly movementType: string,
        public readonly unitCost: number,
        public readonly reasonCode: string,
        public readonly createdBy: string,
        public readonly occurredAt: Date,
        public readonly notes?: string | null
    ) {}
}
