import { Injectable, Inject, Logger } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { OnEvent } from "@nestjs/event-emitter";

import {
    IStockBalanceRepository, 
    IStockLedgerEntryRepository, 
    IStockAlertRepository, 
    IProductSettingsRepository,
    STOCK_BALANCE_REPOSITORY, 
    STOCK_LEDGER_ENTRY_REPOSITORY, 
    STOCK_ALERT_REPOSITORY, 
    PRODUCT_SETTINGS_REPOSITORY,
    StockBalanceEntity, 
    StockLedgerEntryEntity, 
    MovementType, 
    StockReceivedEvent, 
    StockTransferDispatchedEvent,
    StockTransferReceivedEvent, 
    AdjustmentCreatedEvent, 
    CycleCountApprovedEvent, 
    OpeningStockSetEvent, 
    StockAlertEntity,
    ProductSettings
} from "../../../domain";

interface Params {
    productId: string;
    warehouseId: string;
    quantityChange: number;
    movementType: MovementType;
    unitCost: number | null;
    currency?: string | null;
    referenceId: string;
    referenceType: string;
    notes?: string | null;
    createdBy: string;
    occurredAt: Date;
    manager: EntityManager;
}

/** Handle all events with side effects that writes to the immutable ledger and stock balance */

@Injectable()
export class StockBalanceUpdateHandler {
    private readonly logger = new Logger(StockBalanceUpdateHandler.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
        @Inject(STOCK_ALERT_REPOSITORY)
        private readonly alertRepo: IStockAlertRepository,
        @Inject(STOCK_BALANCE_REPOSITORY)
        private readonly balanceRepo: IStockBalanceRepository,
        @Inject(STOCK_LEDGER_ENTRY_REPOSITORY)
        private readonly ledgerRepo: IStockLedgerEntryRepository,
        @Inject(PRODUCT_SETTINGS_REPOSITORY)
        private readonly productSettingRepo:IProductSettingsRepository
    ) {}

    /**
     * Protected method that updates the ledger and balance
     * To be called with a transaction to ensure atomicity
     * Every event handler method is just a thin wrapper that calls with the right arguments
    */
    protected async applyUpdate(params: Params): Promise<{
        product: ProductSettings; balance: StockBalanceEntity;
    } | undefined> {
        const { productId, warehouseId, quantityChange, manager } = params;

        const product = await this.productSettingRepo.findById(productId, manager);
        if (!product || !product.isActive) return ;

        const balance = await this.balanceRepo.findByProductAndWarehouse(product.id, warehouseId, manager)
            ?? StockBalanceEntity.create({ warehouseId, productId });

        balance.apply(quantityChange);

        const ledgerEntry = StockLedgerEntryEntity.create({
            quantityChange,
            productId: product.id,
            warehouseId: balance.warehouseId,
            movementType: params.movementType,
            unitCost: params.unitCost,
            balanceAfter: balance.quantity,
            referenceId: params.referenceId,
            referenceType: params.referenceType,
            notes: params.notes,
            performedBy: params.createdBy
        });

        await this.ledgerRepo.save(ledgerEntry, manager);
        await this.balanceRepo.save(balance, manager);

        this.logger.log(
            `Stock ledger and balance updated. Product: ${product.id} | Balance: ${balance.quantity}`
        );
        
        return { product, balance };
    }

    protected async checkAndAlert(
        product: ProductSettings, balance: StockBalanceEntity, manager: EntityManager
    ): Promise<void> {
        if (!balance.isStockLow(product.reorderPoint)) return;

        const alertExists = await this.alertRepo.findUnresolvedByProductAndWarehouse(
            product.id, balance.warehouseId, manager
        );
        if (alertExists) return;

        const alert = StockAlertEntity.create({
            productId: product.id,
            warehouseId: balance.warehouseId,
            currentBalance: balance.quantity,
            reorderPoint: product.reorderPoint
        });

        await this.alertRepo.save(alert, manager);

        this.logger.warn(
            `LOW STOCK ALERT. Product: ${product.id} | Balance: ${balance.quantity} | Reorder point: ${product.reorderPoint}`
        );

        /**
         * NOTE: Another alert should be fired here for cross-module subscription 
         * Also to trigger the exact module that dispatches the notification
        */
    }

    protected async checkAndResolve(
        product: ProductSettings, balance: StockBalanceEntity, manager: EntityManager
    ): Promise<void> {
        if (balance.isStockLow(product.reorderPoint)) return;

        const alertExists = await this.alertRepo.findUnresolvedByProductAndWarehouse(
            product.id, balance.warehouseId, manager
        );
        if (!alertExists) return;

        alertExists.resolve();
        await this.alertRepo.save(alertExists, manager);

        this.logger.warn(
            `Alert resolved. Product: ${product.id} | Balance: ${balance.quantity} | Reorder point: ${product.reorderPoint}`
        );
    }

    @OnEvent(OpeningStockSetEvent.name, { async: true })
    async handleOpeningStockSetEvent(event: OpeningStockSetEvent): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            const result = await this.applyUpdate({
                productId: event.productId,
                warehouseId: event.warehouseId,
                quantityChange: event.quantity,
                movementType: MovementType.OPENING_STOCK,
                unitCost: event.unitCost,
                currency: event.currency,
                referenceId: event.productId,
                referenceType: 'OPENING_STOCK',
                createdBy: event.createdBy,
                occurredAt: event.occurredAt,
                manager
            });

            if (result) {
                await this.checkAndAlert(result.product, result.balance, manager);
            }
        });
    }

    @OnEvent(StockReceivedEvent.name, { async: true })
    async handleStockReceivedEvent(event: StockReceivedEvent): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            for (const e of event.lines) {
                const result = await this.applyUpdate({
                    productId: e.productId,
                    warehouseId: event.warehouseId,
                    quantityChange: e.quantityReceived,
                    movementType: MovementType.RECEIPT,
                    unitCost: e.unitCostAtOrder,
                    currency: e.currency,
                    referenceId: event.purchaseOrderId,
                    referenceType: 'PURCHASE_ORDER',
                    notes: event.notes,
                    createdBy: event.createdBy,
                    occurredAt: event.occurredAt,
                    manager
                });

                if (result) {
                    await this.checkAndResolve(result.product, result.balance, manager);
                }
            }
        });
    }

    @OnEvent(StockTransferDispatchedEvent.name, { async: true })
    async handleStockTransferDispatchedEvent(event: StockTransferDispatchedEvent): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            for (const e of event.lines) {
                // Note that quantity change is negative, hence the minus (-)
                const result = await this.applyUpdate({
                    productId: e.productId,
                    warehouseId: event.sourceWarehouseId,
                    quantityChange: -e.quantityDispatched,
                    movementType: MovementType.TRANSFER_OUT,
                    unitCost: e.unitCost,
                    referenceId: event.transferId,
                    referenceType: 'STOCK_TRANSFER',
                    notes: event.notes,
                    createdBy: event.createdBy,
                    occurredAt: event.occurredAt,
                    manager
                });

                if (result) {
                    await this.checkAndAlert(result.product, result.balance, manager);
                }
            }
        });
    }

    @OnEvent(StockTransferReceivedEvent.name, { async: true })
    async handleStockTransferReceivedEvent(event: StockTransferReceivedEvent): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            for (const e of event.lines) {
                const result = await this.applyUpdate({
                    productId: e.productId,
                    warehouseId: event.destinationWarehouseId,
                    quantityChange: e.quantityReceived,
                    movementType: MovementType.TRANSFER_IN,
                    unitCost: e.unitCost,
                    referenceId: event.transferId,
                    referenceType: 'STOCK_TRANSFER',
                    notes: event.notes,
                    createdBy: event.createdBy,
                    occurredAt: event.occurredAt,
                    manager
                });

                if (result) {
                    await this.checkAndResolve(result.product, result.balance, manager);
                }

                // If there is variance, update source
                if (e.variance) {
                    const result = await this.applyUpdate({
                        productId: e.productId,
                        warehouseId: event.sourceWarehouseId,
                        quantityChange: -e.variance,
                        movementType: MovementType.ADJUSTMENT_DOWN,
                        unitCost: e.unitCost,
                        referenceId: event.transferId,
                        referenceType: 'STOCK_TRANSFER_VARIANCE',
                        createdBy: event.createdBy,
                        occurredAt: event.occurredAt,
                        manager
                    });

                    if (result) {
                        await this.checkAndAlert(result.product, result.balance, manager);
                    }
                }
            }
        });
    }

    @OnEvent(AdjustmentCreatedEvent.name, { async: true })
    async handleAdjustmentCreatedEvent(event: AdjustmentCreatedEvent): Promise<void> {
        const change = event.movementType === MovementType.ADJUSTMENT_UP
            ? event.quantity : -event.quantity;
        
        await this.dataSource.transaction(async (manager: EntityManager) => {
            const result = await this.applyUpdate({
                productId: event.productId,
                warehouseId: event.warehouseId,
                quantityChange: change,
                movementType: event.movementType as MovementType,
                unitCost: event.unitCost,
                referenceId: event.adjustmentId,
                referenceType: 'ADJUSTMENT',
                notes: event.notes,
                createdBy: event.createdBy,
                occurredAt: event.occurredAt,
                manager
            });

            if (result && event.movementType === MovementType.ADJUSTMENT_UP) {
                await this.checkAndResolve(result.product, result.balance, manager);
            }

            if (result && event.movementType === MovementType.ADJUSTMENT_DOWN) {
                await this.checkAndAlert(result.product, result.balance, manager);
            }
        });
    }

    @OnEvent(CycleCountApprovedEvent.name, { async: true })
    async handleCycleCountApprovedEvent(event: CycleCountApprovedEvent): Promise<void> {
        await this.dataSource.transaction(async (manager: EntityManager) => {
            for (const e of event.lines) {
                if (!e.variance) continue;

                const result = await this.applyUpdate({
                    productId: e.productId,
                    warehouseId: event.warehouseId,
                    quantityChange: e.variance,
                    movementType: MovementType.CYCLE_COUNT_ADJ,
                    unitCost: e.unitCost,
                    referenceId: event.cycleCountId,
                    referenceType: 'CYCLE_COUNT',
                    createdBy: event.approvedBy,
                    occurredAt: event.occurredAt,
                    manager
                });

                if (result) {
                    await this.checkAndAlert(result.product, result.balance, manager);
                    await this.checkAndResolve(result.product, result.balance, manager);
                }
            }
        });
    }
}
