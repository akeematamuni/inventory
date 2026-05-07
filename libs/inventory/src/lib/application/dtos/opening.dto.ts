import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Length } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SetOpeningStockDto {
    @ApiProperty({ type: String, example: 'product-uuid' })
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @ApiProperty({ type: String, example: 'warehouse-uuid' })
    @IsString()
    @IsNotEmpty()
    warehouseId!: string;

    @ApiProperty({ type: Number, example: 500, description: 'Initial stock quantity on system going live' })
    @IsNumber()
    @Min(1)
    quantity!: number;

    @ApiProperty({ type: Number, example: 85.50, description: 'Unit cost for valuation purposes' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    unitCost!: number;

    @ApiPropertyOptional({ type: String, example: 'USD', default: 'USD' })
    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;
}
