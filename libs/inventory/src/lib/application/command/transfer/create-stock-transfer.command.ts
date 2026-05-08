export class CreateStockTransferLine {
    constructor(
        public readonly productId: string,
        public readonly quantityRequested: number,
        public readonly unitCost: number,
    ) {}
}

export class CreateStockTransferCommand {
    constructor(
        public readonly sourceWarehouseId: string,
        public readonly destinationWarehouseId: string,
        public readonly lines: CreateStockTransferLine[],
        public readonly createdBy: string,
        public readonly notes?: string,
    ) {}
}
