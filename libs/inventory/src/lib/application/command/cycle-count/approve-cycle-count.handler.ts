import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Logger } from "@nestjs/common";

import { 
    ICycleCountRepository, 
    CYCLE_COUNT_REPOSITORY,
    CycleCountNotFoundException, 
    IInventoryEventPublisher,
    INVENTORY_EVENT_PUBLISHER, 
    CycleCountApprovedEvent
} from "../../../domain";

import { ApproveCycleCountCommand } from "./approve-cycle-count.command";

@CommandHandler(ApproveCycleCountCommand)
export class ApproveCycleCountHandler implements ICommandHandler<ApproveCycleCountCommand> {
    private readonly logger = new Logger(ApproveCycleCountHandler.name);

    constructor(
        @Inject(INVENTORY_EVENT_PUBLISHER)
        private readonly publisher: IInventoryEventPublisher,
        @Inject(CYCLE_COUNT_REPOSITORY)
        private readonly cycleCountRepo: ICycleCountRepository
    ) {}

    async execute(command: ApproveCycleCountCommand): Promise<void> {
        const { cycleCountId, approvedBy } = command;

        const cycleCount = await this.cycleCountRepo.findById(cycleCountId);
        if (!cycleCount) throw new CycleCountNotFoundException(cycleCountId);

        const varianceLines = cycleCount.approve(approvedBy);

        await this.cycleCountRepo.save(cycleCount);
        this.logger.log(`Cycle count apporoved. User: ${approvedBy} | Cycle-Count: ${cycleCountId}`);

        if (varianceLines.length > 0) {
            await this.publisher.publish(new CycleCountApprovedEvent(
                cycleCount.id,
                cycleCount.warehouseId,
                approvedBy,
                new Date(),
                varianceLines.map(l => ({
                    productId: l.productId,
                    unitCost: l.unitCost,
                    variance: l.variance()
                }))
            ));
        }
    }
}
