import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import {
    IStockTransferRepository, STOCK_TRANSFER_REPOSITORY,
    StockTransferNotFoundException, StockTransferReceivedEvent,
    IInventoryEventPublisher, INVENTORY_EVENT_PUBLISHER,
} from "../../../domain";

import { ReceiveTransferCommand } from "./receive-transfer.command";

@CommandHandler(ReceiveTransferCommand)
export class ReceiveTransferHandler implements ICommandHandler<ReceiveTransferCommand> {
    private readonly logger = new Logger(ReceiveTransferHandler.name);

    constructor(
        @Inject(INVENTORY_EVENT_PUBLISHER)
        private readonly publisher: IInventoryEventPublisher,
        @Inject(STOCK_TRANSFER_REPOSITORY)
        private readonly transferRepo: IStockTransferRepository
    ) {}

    async execute(command: ReceiveTransferCommand): Promise<void> {
        const { transferId, lines, performedBy } = command;

        const transfer = await this.transferRepo.findById(transferId);
        if (!transfer) throw new StockTransferNotFoundException(transferId);

        transfer.receiveLines(
            lines.map(l => ({ lineId: l.lineId, quantity: l.quantityReceived }))
        );

        const saved = await this.transferRepo.save(transfer);
        this.logger.log(`Stock transfer received. User: ${performedBy} | Transfer: ${transferId}`);

        await this.publisher.publish(new StockTransferReceivedEvent(
            transferId, 
            saved.sourceWarehouseId,
            saved.destinationWarehouseId,
            performedBy,
            new Date(),
            saved.lines.map(l => ({
                productId: l.productId,
                unitCost: l.unitCost,
                quantityReceived: l.quantityReceived,
                variance: l.variance
            }))
        ));
    }
}
