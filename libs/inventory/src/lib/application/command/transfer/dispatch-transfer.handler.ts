import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import {
    IStockTransferRepository, 
    STOCK_TRANSFER_REPOSITORY,
    StockTransferNotFoundException, 
    IInventoryEventPublisher,
    INVENTORY_EVENT_PUBLISHER, 
    StockTransferDispatchedEvent
} from '../../../domain';

import { DispatchTransferCommand } from './dispatch-transfer.command';

@CommandHandler(DispatchTransferCommand)
export class DispatchTransferHandler implements ICommandHandler<DispatchTransferCommand> {
    private readonly logger = new Logger(DispatchTransferHandler.name);

    constructor(
        @Inject(INVENTORY_EVENT_PUBLISHER)
        private readonly publisher: IInventoryEventPublisher,
        @Inject(STOCK_TRANSFER_REPOSITORY)
        private readonly transferRepo: IStockTransferRepository,
    ) {}

    async execute(command: DispatchTransferCommand): Promise<void> {
        const { transferId, performedBy } = command;

        const transfer = await this.transferRepo.findById(transferId);
        if (!transfer) throw new StockTransferNotFoundException(transferId);

        const dispatchedLines = transfer.dispatch();
        await this.transferRepo.save(transfer);
        this.logger.log(`Stock transfer dispatched. User: ${performedBy} | Transfer: ${transferId}`);

        await this.publisher.publish(
            new StockTransferDispatchedEvent(
                transfer.id,
                transfer.sourceWarehouseId,
                transfer.destinationWarehouseId,
                performedBy,
                new Date(),
                dispatchedLines.map(l => ({
                    productId: l.productId,
                    quantityDispatched: l.quantityDispatched,
                    unitCost: l.unitCost
                }))
            )
        );
    }
}
