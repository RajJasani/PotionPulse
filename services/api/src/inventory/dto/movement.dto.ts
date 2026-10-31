import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StockMovementType } from '@potionpulse/contracts';

export class CreateMovementDto {
  @ApiProperty({ example: '672416380000000000000001' })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiProperty({ example: '672416380000000000000002', required: false })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.RECEIPT })
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @ApiProperty({ example: 100, description: 'Positive for receipt/in, negative for consumption/sale/out' })
  @IsNumber()
  quantityDelta!: number;

  @ApiProperty({ example: 'piece', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 'Initial stock intake from apothecary supplier' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'manual_adjustment', required: false })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiProperty({ example: 'REF-001', required: false })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ example: 'idemp_unique_tx_123', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
