import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";

import { GetInventoryValuationQuery } from "./get-inventory-valuation.query";
import {
    IStockBalanceRepository, 
    STOCK_BALANCE_REPOSITORY,
    IStockLedgerEntryRepository, 
    STOCK_LEDGER_ENTRY_REPOSITORY,
    StockLedgerEntryEntity, 
    MovementType
} from "../../../domain";
import { 
    InventoryValuationResponseDto, 
    ValuationMethod,
    ValuationScope
} from "../../dtos/reporting.dto";

const UPWARD_MOVEMENTS = [
    MovementType.OPENING_STOCK,
    MovementType.RECEIPT,
    MovementType.TRANSFER_IN,
    MovementType.ADJUSTMENT_UP,
    MovementType.CYCLE_COUNT_ADJ
]

const DOWNWARD_MOVEMENTS = [
    MovementType.ADJUSTMENT_DOWN,
    MovementType.TRANSFER_OUT
]

const PURCHASE_MOVEMENTS = [
    MovementType.OPENING_STOCK,
    MovementType.RECEIPT
]

@QueryHandler(GetInventoryValuationQuery)
export class GetInventoryValuationHandler implements IQueryHandler<GetInventoryValuationQuery> {
    constructor(
        @Inject(STOCK_BALANCE_REPOSITORY)
        private readonly balanceRepo: IStockBalanceRepository,
        @Inject(STOCK_LEDGER_ENTRY_REPOSITORY)
        private readonly ledgerRepo: IStockLedgerEntryRepository
    ) {}

    /** Collision-free grouping of all ledger entries. Specific product and warehouse  */
    private groupByProductAndWarehouse(entries: StockLedgerEntryEntity[]): Map<string, StockLedgerEntryEntity[]> {
        const grouped = new Map<string, StockLedgerEntryEntity[]>();

        for (const entry of entries) {
            // Composite uniqueness
            const key = `${entry.productId}::${entry.warehouseId}`;
            const existing = grouped.get(key);

            if (existing) {
                existing.push(entry);
            } else {
                grouped.set(key, [entry]);
            }
        }

        return grouped;

        // return entries.reduce(
        //     (map, entry) => {
        //         const key = `${entry.productId}::${entry.warehouseId}`;
        //         if (!map.has(key)) map.set(key, []);
        //         map.get(key)!.push(entry);
        //         return map;
        //     },
        //     new Map<string, StockLedgerEntryEntity[]>()
        // );
    }

    /** Calculate the value of remaining stock based on the aveage cost of all stock received. */
    private calculateAVCO(
        upward: StockLedgerEntryEntity[], downward: StockLedgerEntryEntity[]
    ): number {
        const allMovements = [...upward, ...downward].sort(
            (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()
        );

        // Two accumulators that would update looping through each entry
        // How many units are in the pool right now (runningUnits)
        // The total monetary value of those units right now (runningUnitsTotalCost)
        // At any point, runningUnitsTotalCost / runningUnits gives the current average cost per unit
        let runningUnits = 0;
        let runningUnitsTotalCost = 0;

        for (const entry of allMovements) {
            const quantity = Math.abs(entry.quantityChange);
            const isDownward = downward.some(down => down.id === entry.id);

            if (isDownward) {
                // Deplete runningUnitsTotalCost at the average cost
                const averageCost = runningUnits > 0 ? runningUnitsTotalCost / runningUnits : 0;
                runningUnitsTotalCost = Math.max(0, runningUnitsTotalCost - (averageCost * quantity));
                runningUnits = Math.max(0, runningUnits - quantity);

            } else {
                // Entry is upward so value increases
                // Actual unitCost can be used or default to average
                // Approach can be adapted to suit business purposes
                const unitCost = entry.unitCost 
                    ?? (runningUnits > 0 ? runningUnitsTotalCost / runningUnits : 0);
                
                runningUnitsTotalCost += unitCost * quantity;
                runningUnits += quantity;
            }
        }

        return Math.max(0, runningUnitsTotalCost);
    }

    /** Calculate the value of stock based on FIRST-IN FIRST-OUT. */
    private calculateFIFO(
        upward: StockLedgerEntryEntity[], downward: StockLedgerEntryEntity[]
    ): number {
        // Accumulators to hold the data and state through iterations
        let runningAverage = 0;
        let runningTotalUnits = 0;
        const layers: { quantity: number; unitCost: number }[] = [];

        for (const entry of upward) {
            // Extract or derive layers data
            const quantity = Math.abs(entry.quantityChange);
            const unitCost = entry.unitCost ?? (runningTotalUnits > 0 ? runningAverage : 0);

            layers.push({ quantity, unitCost });

            const totalCost = layers.reduce((sum, layer) => sum + (layer.quantity * layer.unitCost), 0);
            runningTotalUnits = layers.reduce((sum, layer) => sum + layer.quantity, 0);
            runningAverage = runningTotalUnits > 0 ? totalCost / runningTotalUnits : 0;
        }

        const downwardSorted = downward.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

        for (const entry of downwardSorted) {
            // Tracks how many down movement units to consume from the layers
            let remaining = Math.abs(entry.quantityChange);

            for (const layer of layers) {
                if (remaining <= 0) break;
                if (layer.quantity <= 0) continue;

                const consumed = Math.min(layer.quantity, remaining);
                layer.quantity -= consumed;
                remaining -= consumed;
            }
        }

        // const totalValue = layers.reduce(
        //     (sum, layer) => sum + (layer.quantity * layer.unitCost), 0
        // );

        // Alternative to using reduce
        let totalValue = 0;
        for (const layer of layers) {
            totalValue += layer.quantity * layer.unitCost;
        }

        return Math.max(0, totalValue);
    }

    async execute(query: GetInventoryValuationQuery): Promise<InventoryValuationResponseDto[]> {
        const { productId:_productId, warehouseId:_warehouseId, method, scope } = query;

        // Fetch all entries in ledger for a specific product in a specific warehouse
        const receipts = await this.ledgerRepo.findAll({
            warehouseId: _warehouseId,
            productId: _productId
        });

        const grouped = this.groupByProductAndWarehouse(receipts);
        const results: InventoryValuationResponseDto[] = [];

        for (const [key, entries] of grouped.entries()) {
            const [productId, warehouseId] = key.split('::');

            const balance = await this.balanceRepo.findByProductAndWarehouse(productId, warehouseId);
            if (!balance || balance.quantity === 0) continue;

            // Sort all the ledger entries for a specific product in a specific warehouse
            const chronological = [...entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

            let totalValue: number;

            // Handle simple scenerio first before the complex scenerio of all movememts
            if (scope === ValuationScope.PURCHASES_ONLY) {
                // Extract OPENING_STOCK and RECEIPT movementfrom the sorted kedger
                const purchaseEntries = chronological.filter(e => PURCHASE_MOVEMENTS.includes(e.movementType));

                // Get valuation for OPENING_STOCK and RECEIPT
                totalValue = method === ValuationMethod.AVCO
                    ? this.calculateAVCO(purchaseEntries, [])
                    : this.calculateFIFO(purchaseEntries, []);

            } else {
                const upwardEntries = chronological.filter(e => 
                    UPWARD_MOVEMENTS.includes(e.movementType) && e.quantityChange > 0
                );

                const downwardEntries = chronological.filter(e => 
                    DOWNWARD_MOVEMENTS.includes(e.movementType) || e.quantityChange < 0
                );

                totalValue = method === ValuationMethod.AVCO
                    ? this.calculateAVCO(upwardEntries, downwardEntries)
                    : this.calculateFIFO(upwardEntries, downwardEntries);
            }

            const averageUnitCost = Math.round((totalValue / balance.quantity) * 100) / 100 || 0;
            
            results.push(new InventoryValuationResponseDto(
                productId, 
                warehouseId, 
                balance.quantity,
                Math.round(totalValue * 100) / 100,
                averageUnitCost,
                method,
                scope
            ));
        }

        return results;
    }
}
