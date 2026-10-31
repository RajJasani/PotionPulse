import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSaleItemDto {
  @ApiProperty({ example: '672416380000000000000001' })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiProperty({ example: 5, description: 'Quantity sold (deducted from inventory)' })
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateSaleDto {
  @ApiProperty({ example: 'SALE-2026-001', required: false })
  @IsString()
  @IsOptional()
  saleNumber?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ApiProperty({ example: 'Walk-in customer potion purchase', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'idemp-sale-001', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

export class RefundSaleDto {
  @ApiProperty({ example: true, description: 'Whether returned ingredients are restocked into inventory' })
  @IsBoolean()
  restock!: boolean;

  @ApiProperty({ example: 'Customer returned unconsumed elixirs' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
