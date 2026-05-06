import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { MovementType } from "../../domain/value-objects/movement-type.vo";
import type { StockBalanceEntity } from "../../domain/entities/stock-balance.entity";
import type { StockLedgerEntryEntity } from "../../domain/entities/stock-ledger-entry.entity";
import type { StockAlertEntity } from '../../domain/entities/stock-alert.entity';
import { StockAlertStatus } from '../../domain/entities/stock-alert.entity';

export enum ValuationMethod {
    FIFO = 'FIFO',
    AVCO = 'AVCO',
}

export enum ValuationScope {
    ALL_MOVEMENTS = 'ALL_MOVEMENTS',
    PURCHASES_ONLY = 'PURCHASES_ONLY'
}

// Deals with balance
export class StockLevelResponseDto {
    @ApiProperty({ type: String }) productId!: string;
    @ApiProperty({ type: String }) warehouseId!: string;
    @ApiProperty({ type: Number }) quantity!: number;
    @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;

    static fromDomain(balance: StockBalanceEntity): StockLevelResponseDto {
        const dto = new StockLevelResponseDto();
        dto.productId = balance.productId;
        dto.warehouseId = balance.warehouseId;
        dto.quantity = balance.quantity;
        dto.updatedAt = balance.updatedAt;
        return dto;
    }
}

// Deals with ledger
export class MovementHistoryResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) productId!: string;
    @ApiProperty({ type: String }) warehouseId!: string;
    @ApiProperty({ enum: MovementType }) movementType!: MovementType;
    @ApiProperty({ type: Number }) quantityChange!: number;
    @ApiProperty({ type: Number }) balanceAfter!: number;
    @ApiProperty({ type: String }) referenceId!: string;
    @ApiProperty({ type: String }) referenceType!: string;
    @ApiProperty({ type: String }) performedBy!: string;
    @ApiPropertyOptional({ type: String }) notes?: string | null;
    @ApiProperty({ type: String, format: 'date-time' }) occurredAt!: Date;

    static fromDomain(entry: StockLedgerEntryEntity): MovementHistoryResponseDto {
        const dto = new MovementHistoryResponseDto();
        dto.id = entry.id;
        dto.productId = entry.productId;
        dto.warehouseId = entry.warehouseId;
        dto.movementType = entry.movementType;
        dto.quantityChange = entry.quantityChange;
        dto.balanceAfter = entry.balanceAfter;
        dto.referenceId = entry.referenceId;
        dto.referenceType = entry.referenceType;
        dto.performedBy = entry.performedBy;
        dto.notes = entry.notes;
        dto.occurredAt = entry.occurredAt;
        return dto;
    }
}

// Deals with alert
export class StockAlertResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) productId!: string;
    @ApiProperty({ type: String }) warehouseId!: string;
    @ApiProperty({ type: Number }) currentBalance!: number;
    @ApiProperty({ type: Number }) reorderPoint!: number;
    @ApiProperty({ enum: StockAlertStatus }) status!: StockAlertStatus;
    @ApiPropertyOptional({ type: String, format: 'date-time' }) resolvedAt?: Date | null;
    @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;

    static fromDomain(alert: StockAlertEntity): StockAlertResponseDto {
        const dto = new StockAlertResponseDto();
        dto.id = alert.id;
        dto.productId = alert.productId;
        dto.warehouseId = alert.warehouseId;
        dto.currentBalance = alert.currentBalance;
        dto.reorderPoint = alert.reorderPoint;
        dto.status = alert.status;
        dto.resolvedAt = alert.resolvedAt;
        dto.createdAt = alert.createdAt;
        return dto;
    }
}

// Deals with valuation
export class InventoryValuationResponseDto {
    @ApiProperty({ type: String }) productId: string;
    @ApiProperty({ type: String }) warehouseId: string;
    @ApiProperty({ type: Number }) currentBalance: number;
    @ApiProperty({ type: Number }) totalValue: number;
    @ApiProperty({ type: Number }) averageUnitCost: number;
    @ApiProperty({ enum: ValuationMethod }) valuationMethod: ValuationMethod;
    @ApiProperty({ enum: ValuationScope }) valuationScope: ValuationScope;

    constructor(
        productId: string,
        warehouseId: string,
        currentBalance: number,
        totalValue: number,
        averageUnitCost: number,
        valuationMethod: ValuationMethod,
        valuationScope: ValuationScope
    ) {
        this.productId = productId;
        this.warehouseId = warehouseId;
        this.currentBalance = currentBalance;
        this.totalValue = totalValue;
        this.averageUnitCost = averageUnitCost;
        this.valuationMethod = valuationMethod;
        this.valuationScope = valuationScope
    }
}
