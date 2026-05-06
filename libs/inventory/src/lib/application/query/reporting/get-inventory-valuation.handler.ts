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
        upward: StockLedgerEntryEntity[], downward: StockLedgerEntryEntity[], currentBalance: number
    ): number {
        const allMovements = [...upward, ...downward].sort(
            (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()
        );

        let runningUnits = 0;
        let runningCostPool = 0;

        for (const entry of allMovements) {
            const quantity = Math.abs(entry.quantityChange);
            const isDownward = downward.some(down => down.id === entry.id);

            if (isDownward) {
                // Deplete pool at the average cost
                const averageCost = runningUnits > 0 ? runningCostPool / runningUnits : 0;
                runningCostPool = Math.max(0, runningCostPool - (averageCost * quantity));
                runningUnits = Math.max(0, runningUnits - quantity);

            } else {
                const unitCost = entry.unitCost ?? (runningUnits > 0 ? runningCostPool / runningUnits : 0);
                runningCostPool += unitCost * quantity;
                runningUnits += quantity;
            }
        }

        return Math.max(0, runningCostPool);
    }

    /** Calculate the value of stock based on FIRST-IN FIRST-OUT. */
    private calculateFIFO(
        upward: StockLedgerEntryEntity[], downward: StockLedgerEntryEntity[], currentBalance: number
    ): number {
        let totalUnits = 0;
        let runningAverage = 0;
        const layers: { quantity: number; unitCost: number }[] = [];

        for (const entry of upward) {
            const quantity = Math.abs(entry.quantityChange);
            const unitCost = entry.unitCost ?? (totalUnits > 0 ? runningAverage : 0);

            layers.push({ quantity, unitCost });

            const totalCost = layers.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
            totalUnits = layers.reduce((sum, l) => sum + l.quantity, 0);
            runningAverage = totalUnits > 0 ? totalCost / totalUnits : 0;
        }

        const downwardSorted = downward.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

        for (const entry of downwardSorted) {
            let remaining = Math.abs(entry.quantityChange);

            for (const layer of layers) {
                if (remaining <= 0) break;
                if (layer.quantity <= 0) continue;

                const consumed = Math.min(layer.quantity, remaining);
                layer.quantity -= consumed;
                remaining -= consumed;
            }
        }

        const totalValue = layers.reduce(
            (sum, layer) => sum + layer.quantity * layer.unitCost, 0
        );

        return Math.max(0, totalValue);

        // Sort the ledger entries into layers based on time stock came in
        // const layers = [...upward].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

        // let remainingUnits = currentBalance;
        // let totalValue = 0;

        // // Calculate value from the newest to oldest
        // for (const layer of layers.reverse()) {
        //     if (remainingUnits <= 0) break;

        //     const layerQty = Math.min(layer.quantityChange, remainingUnits);
        //     totalValue += layerQty * (layer.unitCost ?? 0);

        //     remainingUnits -= layerQty;
        // }

        // return Math.round(totalValue * 100) / 100;
    }

    async execute(query: GetInventoryValuationQuery): Promise<InventoryValuationResponseDto[]> {
        const { productId:_productId, warehouseId:_warehouseId, method, scope } = query;

        // Fetch all entries in ledger with movetype of receipt
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
                    ? this.calculateAVCO(purchaseEntries, [], balance.quantity)
                    : this.calculateFIFO(purchaseEntries, [], balance.quantity);

            } else {
                const upwardEntries = chronological.filter(e => 
                    UPWARD_MOVEMENTS.includes(e.movementType) && e.quantityChange > 0
                );

                const downwardEntries = chronological.filter(e => 
                    DOWNWARD_MOVEMENTS.includes(e.movementType) || e.quantityChange < 0
                );

                totalValue = method === ValuationMethod.AVCO
                    ? this.calculateAVCO(upwardEntries, downwardEntries, balance.quantity)
                    : this.calculateFIFO(upwardEntries, downwardEntries, balance.quantity);
            }

            const averageUnitCost = Math.round((totalValue / balance.quantity) * 10000) / 10000 || 0;
            
            results.push(new InventoryValuationResponseDto(
                productId, 
                warehouseId, 
                balance.quantity,
                totalValue,
                averageUnitCost,
                method,
                scope
            ));
        }

        return results;
    }
}
