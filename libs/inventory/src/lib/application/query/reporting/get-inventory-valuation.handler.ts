import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";

import {
    IStockBalanceRepository, 
    STOCK_BALANCE_REPOSITORY,
    IStockLedgerEntryRepository, 
    STOCK_LEDGER_ENTRY_REPOSITORY,
    StockLedgerEntryEntity, 
    MovementType
} from "../../../domain";

import { GetInventoryValuationQuery } from "./get-inventory-valuation.query";
import { InventoryValuationResponseDto, ValuationMethod } from "../../dtos/reporting.dto";

@QueryHandler(GetInventoryValuationQuery)
export class GetInventoryValuationHandler implements IQueryHandler<GetInventoryValuationQuery> {
    constructor(
        @Inject(STOCK_BALANCE_REPOSITORY)
        private readonly balanceRepo: IStockBalanceRepository,
        @Inject(STOCK_LEDGER_ENTRY_REPOSITORY)
        private readonly ledgerRepo: IStockLedgerEntryRepository
    ) {}

    /** Collision-free grouping of all ledger entries that happened due to purchasing  */
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
    private calculateAVCO(entries: StockLedgerEntryEntity[], currentBalance: number): number {
        // totalReceiptCost / totalReceptUnit * currentBalance
        let totalReceiptCost = 0;
        let totalReceptUnit = 0;

        for (const entry of entries) {
            totalReceiptCost += entry.unitCost ?? 0;
            totalReceptUnit += entry.quantityChange;
        }

        // if (totalReceptUnit === 0) return 0;

        const avg = totalReceiptCost / totalReceptUnit;
        return Math.round((avg * currentBalance) * 100) / 100;
    }

    /** Calculate the value of stock based on FIRST-IN FIRST-OUT. */
    private calculateFIFO(entries: StockLedgerEntryEntity[], currentBalance: number): number {
        // Sort the ledger entries into layers based on time stock came in
        const layers = [...entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

        let remainingUnits = currentBalance;
        let totalValue = 0;

        // Calculate value from the newest to oldest
        for (const layer of layers.reverse()) {
            if (remainingUnits <= 0) break;

            const layerQty = Math.min(layer.quantityChange, remainingUnits);
            totalValue += layerQty * (layer.unitCost ?? 0);

            remainingUnits -= layerQty;
        }

        return Math.round(totalValue * 100) / 100;
    }

    async execute(query: GetInventoryValuationQuery): Promise<InventoryValuationResponseDto[]> {
        const { productId:_productId, warehouseId:_warehouseId, method } = query;

        // Fetch all entries in ledger with movetype of receipt
        const receipts = await this.ledgerRepo.findAll({
            movementType: MovementType.RECEIPT,
            warehouseId: _warehouseId,
            productId: _productId
        });

        const grouped = this.groupByProductAndWarehouse(receipts);
        const results: InventoryValuationResponseDto[] = [];

        for (const [key, entries] of grouped.entries()) {
            const [productId, warehouseId] = key.split('::');

            const balance = await this.balanceRepo.findByProductAndWarehouse(productId, warehouseId);
            if (!balance || balance.quantity === 0) continue;

            const valuation = method === ValuationMethod.AVCO
                ? this.calculateAVCO(entries, balance.quantity)
                : this.calculateFIFO(entries, balance.quantity);
            
            results.push(new InventoryValuationResponseDto(
                productId, 
                warehouseId, 
                balance.quantity,
                valuation,
                method
            ));
        }

        return results;
    }
}
