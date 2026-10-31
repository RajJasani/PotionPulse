import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.01)
  orderedQty!: number;

  @ApiProperty({ example: 1.25 })
  @IsNumber()
  @Min(0)
  unitCost!: number;

  @ApiPropertyOptional({ example: 25, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  packSize?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d9' })
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @ApiPropertyOptional({ example: 'PO-2026-0001' })
  @IsString()
  @IsOptional()
  poNumber?: string;

  @ApiPropertyOptional({ example: '2026-11-05T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  expectedAt?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];

  @ApiPropertyOptional({ example: 'Urgent restock for festival surge' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateRecommendedPODto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d9' })
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @ApiPropertyOptional({ example: 14, default: 14 })
  @IsNumber()
  @IsOptional()
  horizonDays?: number = 14;

  @ApiPropertyOptional({ example: 'Automated restock order based on AI demand forecast' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceiveStockItemDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0.01)
  quantityReceived!: number;

  @ApiPropertyOptional({ example: 'Inspected and verified batch on arrival' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceiveStockItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveStockItemDto)
  receipts!: ReceiveStockItemDto[];
}
