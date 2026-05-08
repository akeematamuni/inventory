import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { StockTransferStatus } from "../../domain/entities/stock-transfer.entity";
import type { StockTransferEntity } from "../../domain/entities/stock-transfer.entity";

export class CreateStockTransferLineDto {
    @ApiProperty({ type: String, example: 'product-uuid' })
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @ApiProperty({ type: Number, example: 100 })
    @IsNumber()
    @Min(1)
    quantityRequested!: number;

    @ApiProperty({ type: Number, example: 130.25 })
    @IsNumber()
    @Min(1)
    unitCost!: number;
}

export class CreateStockTransferDto {
    @ApiProperty({ type: String, example: 'source-warehouse-uuid' })
    @IsString()
    @IsNotEmpty()
    sourceWarehouseId!: string;

    @ApiProperty({ type: String, example: 'destination-warehouse-uuid' })
    @IsString()
    @IsNotEmpty()
    destinationWarehouseId!: string;

    @ApiProperty({ type: () => [CreateStockTransferLineDto] })
    @IsArray()
    @Type(() => CreateStockTransferLineDto)
    @ValidateNested({ each: true })
    lines!: CreateStockTransferLineDto[];

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class ReceiveTransferLineDto {
    @ApiProperty({ type: String, example: 'line-uuid' })
    @IsString()
    @IsNotEmpty()
    lineId!: string;

    @ApiProperty({ type: Number, example: 98 })
    @IsNumber()
    @Min(0)
    quantityReceived!: number;
}

export class ReceiveTransferDto {
    @ApiProperty({ type: () => [ReceiveTransferLineDto] })
    @IsArray()
    @Type(() => ReceiveTransferLineDto)
    @ValidateNested({ each: true })
    lines!: ReceiveTransferLineDto[];
}

export class StockTransferLineResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) productId!: string;
    @ApiProperty({ type: Number }) quantityRequested!: number;
    @ApiProperty({ type: Number }) quantityDispatched!: number;
    @ApiProperty({ type: Number }) quantityReceived!: number;
    @ApiProperty({ type: Number }) variance!: number;
    @ApiProperty({ type: Boolean }) isFullyReceived!: boolean;
}

export class StockTransferResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) sourceWarehouseId!: string;
    @ApiProperty({ type: String }) destinationWarehouseId!: string;
    @ApiProperty({ enum: StockTransferStatus }) status!: StockTransferStatus;
    @ApiProperty({ type: () => [StockTransferLineResponseDto] })
    lines!: StockTransferLineResponseDto[];
    @ApiPropertyOptional({ type: String }) notes?: string | null;
    @ApiProperty({ type: String }) createdBy!: string;
    @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
    @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;

    static fromDomain(transfer: StockTransferEntity): StockTransferResponseDto {
        const dto = new StockTransferResponseDto();
        dto.id = transfer.id;
        dto.sourceWarehouseId = transfer.sourceWarehouseId;
        dto.destinationWarehouseId = transfer.destinationWarehouseId;
        dto.status = transfer.status;
        dto.lines = transfer.lines.map(line => {
            const lineDto = new StockTransferLineResponseDto();
            lineDto.id = line.id;
            lineDto.productId = line.productId;
            lineDto.quantityRequested = line.quantityRequested;
            lineDto.quantityDispatched = line.quantityDispatched;
            lineDto.quantityReceived = line.quantityReceived;
            lineDto.variance = line.variance;
            lineDto.isFullyReceived = line.isFullyReceived;
            return lineDto;
        });
        dto.notes = transfer.notes;
        dto.createdBy = transfer.createdBy;
        dto.createdAt = transfer.createdAt;
        dto.updatedAt = transfer.updatedAt;
        return dto;
    }
}
