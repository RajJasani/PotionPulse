import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
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

  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d1', description: 'Optional recipe ID if selling formulated potion' })
  @IsString()
  @IsOptional()
  recipeId?: string;
}

export class CreateSaleDto {
  @ApiProperty({ example: 'SALE-2026-001', required: false })
  @IsString()
  @IsOptional()
  saleNumber?: string;

  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d9', description: 'Customer profile ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

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

export class CreateCustomerDto {
  @ApiProperty({ example: 'Alchemist Valen' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'valen@guildofmages.org' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0192' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: ['standard', 'vip', 'guild', 'wholesale'], default: 'standard' })
  @IsEnum(['standard', 'vip', 'guild', 'wholesale'])
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional({ example: 'Guildmaster of the Obsidian Circle' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Alchemist Valen' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'valen@guildofmages.org' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0192' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: ['standard', 'vip', 'guild', 'wholesale'] })
  @IsEnum(['standard', 'vip', 'guild', 'wholesale'])
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional({ example: 'Updated guild notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
