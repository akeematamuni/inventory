import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import {
    ICycleCountRepository, 
    CYCLE_COUNT_REPOSITORY,
    IWarehouseRepository, 
    WAREHOUSE_REPOSITORY,
    IProductSettingsRepository, 
    PRODUCT_SETTINGS_REPOSITORY,
    IStockBalanceRepository, 
    STOCK_BALANCE_REPOSITORY,
    WarehouseNotFoundException, 
    WarehouseInactiveException,
    ProductNotFoundException, 
    ProductInactiveException,
    CycleCountEntity
} from "../../../domain";

import { CreateCycleCountCommand } from "./create-cycle-count.command";

@CommandHandler(CreateCycleCountCommand)
export class CreateCycleCountHandler implements ICommandHandler<CreateCycleCountCommand> {
    private readonly logger = new Logger(CreateCycleCountHandler.name);

    constructor(
        @Inject(WAREHOUSE_REPOSITORY)
        private readonly warehouseRepo: IWarehouseRepository,
        @Inject(STOCK_BALANCE_REPOSITORY)
        private readonly balanceRepo: IStockBalanceRepository,
        @Inject(CYCLE_COUNT_REPOSITORY)
        private readonly cycleCountRepo: ICycleCountRepository,
        @Inject(PRODUCT_SETTINGS_REPOSITORY)
        private readonly productRepo: IProductSettingsRepository
    ) {}

    async execute(command: CreateCycleCountCommand): Promise<string> {
        const { warehouseId, lines, createdBy, notes } = command;

        // Guard 1: warehouse must exist and be active
        const warehouse = await this.warehouseRepo.findById(warehouseId);
        if (!warehouse) {
            throw new WarehouseNotFoundException(warehouseId);
        }
        if (!warehouse.isActive) {
            throw new WarehouseInactiveException(warehouseId);
        }

        // Guard 2: product must exist and be active
        for (const line of lines) {
            const product = await this.productRepo.findById(line.productId);
            if (!product) {
                throw new ProductNotFoundException(line.productId);
            }
            if (!product.isActive) {
                throw new ProductInactiveException(line.productId);
            }
        }

        const cycleCount = CycleCountEntity.create({
            warehouseId,
            notes,
            createdBy,
            lines: lines.map(l => ({
                productId: l.productId,
                systemQuantity: l.systemQuantity,
                unitCost: l.unitCost
            }))
        });

        const saved = await this.cycleCountRepo.save(cycleCount);
        this.logger.log(`Cycle count created. User: ${createdBy} | Cycle-Count: ${cycleCount.id}`);
        return saved.id;
    }
}
