import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Bat Wings' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ING-BAT-001', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 'Animal Parts', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'piece' })
  @IsString()
  @IsNotEmpty()
  baseUnit!: string;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiProperty({ example: 20, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  safetyStock?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @ApiProperty({ example: 2.5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @ApiProperty({ example: '672416380000000000000001', required: false })
  @IsString()
  @IsOptional()
  defaultLocationId?: string;
}

export class UpdateIngredientDto {
  @ApiProperty({ example: 'Bat Wings (Dried)', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'ING-BAT-001-D', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 'Rare Ingredients', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'piece', required: false })
  @IsString()
  @IsOptional()
  baseUnit?: string;

  @ApiProperty({ example: 35, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiProperty({ example: 25, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  safetyStock?: number;

  @ApiProperty({ example: 4, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @ApiProperty({ example: 3.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerUnit?: number;
}
