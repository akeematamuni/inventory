export class CreateCycleCountLine {
    constructor(
        public readonly productId: string,
        public readonly unitCost: number,
        public readonly systemQuantity: number,
    ) {}
}

export class CreateCycleCountCommand {
    constructor(
        public readonly warehouseId: string,
        public readonly lines: CreateCycleCountLine[],
        public readonly createdBy: string,
        public readonly notes?: string,
    ) {}
}
