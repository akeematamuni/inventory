export class SetOpeningStockCommand {
    constructor(
        public readonly productId: string,
        public readonly warehouseId: string,
        public readonly quantity: number,
        public readonly performedBy: string,
        public readonly unitCost: number,
        public readonly currency?: string,
    ) {}
}
