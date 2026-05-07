import { Controller, Inject, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { QueryBus } from "@nestjs/cqrs";

import { MovementType, StockAlertStatus } from '../../domain';

import {
    StockLevelResponseDto,
    MovementHistoryResponseDto, 
    StockAlertResponseDto, 
    InventoryValuationResponseDto,
    GetStockLevelsQuery, 
    GetMovementHistoryQuery, 
    GetStockAlertsQuery, 
    GetInventoryValuationQuery,
    ValuationMethod,
    ValuationScope
} from '../../application';

@ApiTags('Reporting')
@ApiBearerAuth()
@Controller('reporting')
export class ReportingController {
    constructor(@Inject(QueryBus) private readonly queryBus: QueryBus) {}

    @Get('stock-levels')
    @ApiOperation({ summary: 'Get current stock levels' })
    @ApiQuery({ name: 'warehouseId', required: false, type: String })
    @ApiQuery({ name: 'productId', required: false, type: String })
    @ApiResponse({ status: 200, type: () => [StockLevelResponseDto] })
    getStockLevels(
        @Query('warehouseId') warehouseId?: string,
        @Query('productId') productId?: string,
    ): Promise<StockLevelResponseDto[]> {
        return this.queryBus.execute(new GetStockLevelsQuery(warehouseId, productId));
    }

    @Get('movement-history')
    @ApiOperation({ summary: 'Get stock movement history with filters' })
    @ApiQuery({ name: 'productId', required: false, type: String })
    @ApiQuery({ name: 'warehouseId', required: false, type: String })
    @ApiQuery({ name: 'movementType', required: false, enum: MovementType })
    @ApiQuery({ name: 'fromDate', required: false, type: String })
    @ApiQuery({ name: 'toDate', required: false, type: String })
    @ApiResponse({ status: 200, type: () => [MovementHistoryResponseDto] })
    getMovementHistory(
        @Query('productId') productId?: string,
        @Query('warehouseId') warehouseId?: string,
        @Query('movementType') movementType?: MovementType,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<MovementHistoryResponseDto[]> {
        return this.queryBus.execute(new GetMovementHistoryQuery(
            productId,
            warehouseId,
            movementType,
            fromDate ? new Date(fromDate) : undefined,
            toDate ? new Date(toDate) : undefined,
        ));
    }

    @Get('stock-alerts')
    @ApiOperation({ summary: 'Fetch low stock alerts' })
    @ApiQuery({ name: 'status', required: false, enum: StockAlertStatus })
    @ApiQuery({ name: 'warehouseId', required: false, type: String })
    @ApiQuery({ name: 'productId', required: false, type: String })
    @ApiResponse({ status: 200, type: () => [StockAlertResponseDto] })
    getLowStockAlerts(
        @Query('status') status?: StockAlertStatus,
        @Query('warehouseId') warehouseId?: string,
        @Query('productId') productId?: string,
    ): Promise<StockAlertResponseDto[]> {
        return this.queryBus.execute(new GetStockAlertsQuery(status, warehouseId, productId));
    }

    @Get('valuation')
    @ApiOperation({ summary: 'Get inventory valuation using FIFO or AVCO' })
    @ApiQuery({ name: 'method', required: true, enum: ValuationMethod })
    @ApiQuery({ name: 'scope', required: true, enum: ValuationScope })
    @ApiQuery({ name: 'warehouseId', required: true, type: String })
    @ApiQuery({ name: 'productId', required: false, type: String })
    @ApiResponse({ status: 200, type: () => [InventoryValuationResponseDto] })
    getValuation(
        @Query('method') method: ValuationMethod,
        @Query('scope') scope: ValuationScope,
        @Query('warehouseId') warehouseId: string,
        @Query('productId') productId?: string,
    ): Promise<InventoryValuationResponseDto[]> {
        return this.queryBus.execute(new GetInventoryValuationQuery(method, scope, warehouseId, productId));
    }
}
