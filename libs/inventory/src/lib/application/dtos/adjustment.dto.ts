import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { MovementType } from "../../domain/value-objects/movement-type.vo";
import type { AdjustmentEntity } from "../../domain/entities/adjustment.entity";
import { AdjustmentReasonCode } from "../../domain/value-objects/adjustment-reason.vo";

export class CreateAdjustmentDto {
    @ApiProperty({ type: String, example: 'product-uuid' })
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @ApiProperty({ type: String, example: 'warehouse-uuid' })
    @IsString()
    @IsNotEmpty()
    warehouseId!: string;

    @ApiProperty({ type: Number, example: 12 })
    @IsNumber()
    @Min(1)
    quantity!: number;

    @ApiProperty({ enum: MovementType, example: MovementType.ADJUSTMENT_DOWN })
    @IsEnum(MovementType)
    movementType!: MovementType;

    @ApiProperty({ type: Number, example: 13.45 })
    @IsNumber()
    @Min(0.01)
    unitCost!: number;

    @ApiProperty({ enum: AdjustmentReasonCode, example: AdjustmentReasonCode.DAMAGE })
    @IsEnum(AdjustmentReasonCode)
    reasonCode!: AdjustmentReasonCode;

    @ApiPropertyOptional({ type: String, example: 'Items found damaged on shelf 3B' })
    @IsOptional()
    @IsString()
    reasonNotes?: string;

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class AdjustmentResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) productId!: string;
    @ApiProperty({ type: String }) warehouseId!: string;
    @ApiProperty({ type: Number }) quantity!: number;
    @ApiProperty({ enum: MovementType }) movementType!: MovementType;
    @ApiProperty({ type: Number }) unitCost!: number;
    @ApiProperty({ enum: AdjustmentReasonCode }) reasonCode!: AdjustmentReasonCode;
    @ApiPropertyOptional({ type: String }) reasonNotes?: string | null;
    @ApiProperty({ type: String }) performedBy!: string;
    @ApiPropertyOptional({ type: String }) notes?: string | null;
    @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;

    static fromDomain(adjustment: AdjustmentEntity): AdjustmentResponseDto {
        const dto = new AdjustmentResponseDto();
        dto.id = adjustment.id;
        dto.productId = adjustment.productId;
        dto.warehouseId = adjustment.warehouseId;
        dto.quantity = adjustment.quantity;
        dto.movementType = adjustment.movementType;
        dto.unitCost = adjustment.unitCost;
        dto.reasonCode = adjustment.reason.code;
        dto.reasonNotes = adjustment.reason.notes;
        dto.performedBy = adjustment.createdBy;
        dto.notes = adjustment.notes;
        dto.createdAt = adjustment.createdAt;
        return dto;
    }
}
