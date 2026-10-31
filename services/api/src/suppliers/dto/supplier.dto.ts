import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CatalogItemDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiPropertyOptional({ example: 'SUP-BW-01' })
  @IsString()
  @IsOptional()
  supplierSku?: string;

  @ApiProperty({ example: 1.25 })
  @IsNumber()
  @Min(0)
  unitCost!: number;

  @ApiProperty({ example: 5, default: 3 })
  @IsNumber()
  @Min(0)
  leadTimeDays = 3;

  @ApiProperty({ example: 50, default: 1 })
  @IsNumber()
  @Min(1)
  moq = 1;

  @ApiProperty({ example: 25, default: 1 })
  @IsNumber()
  @Min(1)
  packSize = 1;
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'Nocturnal Botanicals Ltd' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Lord Malakar' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'orders@nocturnalbotanicals.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-839-2819' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Shadow Alley 4, Ravenhold' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 4, default: 3 })
  @IsNumber()
  @Min(0)
  leadTimeDays = 3;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [CatalogItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogItemDto)
  @IsOptional()
  catalog?: CatalogItemDto[];

  @ApiPropertyOptional({ example: 'Primary vendor for Midnight Curse reagents' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'Nocturnal Botanicals Ltd' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Lord Malakar' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'orders@nocturnalbotanicals.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-839-2819' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Shadow Alley 4, Ravenhold' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [CatalogItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogItemDto)
  @IsOptional()
  catalog?: CatalogItemDto[];

  @ApiPropertyOptional({ example: 'Updated vendor notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
