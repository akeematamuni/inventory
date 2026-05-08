export class CycleCountApprovedEvent {
    constructor(
        public readonly cycleCountId: string,
        public readonly warehouseId: string,
        public readonly approvedBy: string,
        public readonly occurredAt: Date,
        public readonly lines: {
            productId: string;
            unitCost: number;
            variance: number | null;
        }[],
    ) {}
}
