import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { CycleCountStatus } from "../../domain/entities/cycle-count.entity";
import type { CycleCountEntity } from "../../domain/entities/cycle-count.entity";

export class CreateCycleCountLineDto {
    @ApiProperty({ type: String, example: 'product-uuid' })
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @ApiProperty({ type: Number, example: 12.34 })
    @IsNumber()
    @Min(0)
    unitCost!: number;

    @ApiProperty({ type: Number, example: 300, description: 'Current system balance at time of count creation' })
    @IsNumber()
    @Min(0)
    systemQuantity!: number;
}

export class CreateCycleCountDto {
    @ApiProperty({ type: String, example: 'warehouse-uuid' })
    @IsString()
    @IsNotEmpty()
    warehouseId!: string;

    @ApiProperty({ type: () => [CreateCycleCountLineDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCycleCountLineDto)
    lines!: CreateCycleCountLineDto[];

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class SubmitCycleCountLineDto {
    @ApiProperty({ type: String, example: 'line-uuid' })
    @IsString()
    @IsNotEmpty()
    lineId!: string;

    @ApiProperty({ type: Number, example: 287, description: 'Physical count observed on the shelf' })
    @IsNumber()
    @Min(0)
    countedQuantity!: number;
}

export class SubmitCycleCountDto {
    @ApiProperty({ type: String, example: 'cycle-count-uuid' })
    @IsString()
    @IsNotEmpty()
    cycleCountId!: string;

    @ApiProperty({ type: () => [SubmitCycleCountLineDto] })
    @IsArray()
    @Type(() => SubmitCycleCountLineDto)
    @ValidateNested({ each: true })
    lines!: SubmitCycleCountLineDto[];
}

export class ApproveOrRejectCycleCountDto {
    @ApiProperty({ type: String, example: 'cycle-count-uuid' })
    @IsString()
    @IsNotEmpty()
    cycleCountId!: string;
}

export class CycleCountLineResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) productId!: string;
    @ApiProperty({ type: Number }) unitCost!: number;
    @ApiProperty({ type: Number }) systemQuantity!: number;
    @ApiPropertyOptional({ type: Number }) countedQuantity?: number | null;
    @ApiPropertyOptional({ type: Number }) variance?: number | null;
    @ApiProperty({ type: Boolean }) isCounted!: boolean;
}

export class CycleCountResponseDto {
    @ApiProperty({ type: String }) id!: string;
    @ApiProperty({ type: String }) warehouseId!: string;
    @ApiProperty({ enum: CycleCountStatus }) status!: CycleCountStatus;
    @ApiProperty({ type: () => [CycleCountLineResponseDto] })
    lines!: CycleCountLineResponseDto[];
    @ApiPropertyOptional({ type: String }) approvedBy?: string | null;
    @ApiPropertyOptional({ type: String }) notes?: string | null;
    @ApiProperty({ type: String }) createdBy!: string;
    @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
    @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;

    static fromDomain(cycleCount: CycleCountEntity): CycleCountResponseDto {
        const dto = new CycleCountResponseDto();
        dto.id = cycleCount.id;
        dto.warehouseId = cycleCount.warehouseId;
        dto.status = cycleCount.status;
        dto.lines = cycleCount.lines.map(line => {
            const lineDto = new CycleCountLineResponseDto();
            lineDto.id = line.id;
            lineDto.productId = line.productId;
            lineDto.unitCost = line.unitCost;
            lineDto.systemQuantity = line.systemQuantity;
            lineDto.countedQuantity = line.countedQuantity;
            lineDto.variance = line.variance();
            lineDto.isCounted = line.isCounted();
            return lineDto;
        });
        dto.approvedBy = cycleCount.approvedBy;
        dto.notes = cycleCount.notes;
        dto.createdBy = cycleCount.createdBy;
        dto.createdAt = cycleCount.createdAt;
        dto.updatedAt = cycleCount.updatedAt;
        return dto;
    }
}
