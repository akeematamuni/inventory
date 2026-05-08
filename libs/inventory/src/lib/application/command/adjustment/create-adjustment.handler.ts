import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import {
    IAdjustmentRepository, 
    ADJUSTMENT_REPOSITORY,
    AdjustmentEntity, 
    AdjustmentCreatedEvent,
    IWarehouseRepository, 
    WAREHOUSE_REPOSITORY,
    IProductSettingsRepository, 
    PRODUCT_SETTINGS_REPOSITORY,
    WarehouseNotFoundException, 
    WarehouseInactiveException,
    ProductNotFoundException, 
    ProductInactiveException,
    IStockBalanceRepository, 
    STOCK_BALANCE_REPOSITORY,
    MovementType, 
    AdjustmentReason, 
    InsufficientStockException,
    IInventoryEventPublisher, 
    INVENTORY_EVENT_PUBLISHER
} from "../../../domain";

import { CreateAdjustmentCommand } from "./create-adjustment.command";

@CommandHandler(CreateAdjustmentCommand)
export class CreateAdjustmentHandler implements ICommandHandler<CreateAdjustmentCommand> {
    private readonly logger = new Logger(CreateAdjustmentHandler.name);

    constructor(
        @Inject(ADJUSTMENT_REPOSITORY)
        private readonly adjRepo: IAdjustmentRepository,
        @Inject(WAREHOUSE_REPOSITORY)
        private readonly warehouseRepo: IWarehouseRepository,
        @Inject(PRODUCT_SETTINGS_REPOSITORY)
        private readonly productRepo: IProductSettingsRepository,
        @Inject(STOCK_BALANCE_REPOSITORY)
        private readonly balanceRepo: IStockBalanceRepository,
        @Inject(INVENTORY_EVENT_PUBLISHER)
        private readonly publisher: IInventoryEventPublisher
    ) {}

    async execute(command: CreateAdjustmentCommand): Promise<string> {
        const { 
            productId, 
            warehouseId, 
            quantity, 
            movementType, 
            unitCost,
            reasonCode, 
            performedBy,
            notes, 
            reasonNotes
        } = command;

        const adjustment = AdjustmentEntity.create({
            productId,
            warehouseId,
            movementType,
            unitCost,
            quantity,
            notes,
            createdBy: performedBy,
            reason: AdjustmentReason.create({
                code: reasonCode, 
                notes: reasonNotes
            })
        });
        
        // Guard 1: warehouse must exist and be active
        const warehouse = await this.warehouseRepo.findById(warehouseId);
        if (!warehouse) throw new WarehouseNotFoundException(warehouseId);
        if (!warehouse.isActive) throw new WarehouseInactiveException(warehouseId);

        // Guard 2: product must exist and be active
        const product = await this.productRepo.findById(productId);
        if (!product) throw new ProductNotFoundException(productId);
        if (!product.isActive) throw new ProductInactiveException(productId);

        // Guard 3: adjustment can not be higher than balance
        if (movementType === MovementType.ADJUSTMENT_DOWN) {
            const balance = await this.balanceRepo.findByProductAndWarehouse(productId, warehouseId);
            const available = balance?.quantity ?? 0;

            if (available < quantity) throw new InsufficientStockException(
                productId, warehouseId, quantity, available
            );
        }

        await this.adjRepo.save(adjustment);
        this.logger.log(`Adjustment created. User: ${performedBy} | Adjustment: ${adjustment.id}`);

        await this.publisher.publish(new AdjustmentCreatedEvent(
            adjustment.id,
            adjustment.productId,
            adjustment.warehouseId,
            adjustment.quantity,
            adjustment.movementType,
            adjustment.unitCost,
            adjustment.reason.code,
            adjustment.createdBy,
            adjustment.createdAt,
            adjustment.notes
        ));

        return adjustment.id;
    }
}
