import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDemandEventDto {
  @ApiProperty({ example: 'Midnight Curse Festival' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'High-potency nocturnal festival surging demand for specific reagents' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-10-19T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @ApiProperty({ example: '2026-10-21T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  endAt!: string;

  @ApiProperty({ example: 3.0, default: 3.0 })
  @IsNumber()
  @Min(0.1)
  multiplier = 3.0;

  @ApiProperty({
    example: ['65f1a2b3c4d5e6f7a8b9c0d1', '65f1a2b3c4d5e6f7a8b9c0d2', '65f1a2b3c4d5e6f7a8b9c0d3'],
    description: 'List of affected ingredient IDs',
  })
  @IsArray()
  @IsString({ each: true })
  ingredientIds: string[] = [];

  @ApiPropertyOptional({ enum: ['scheduled', 'active', 'expired', 'archived'], default: 'active' })
  @IsEnum(['scheduled', 'active', 'expired', 'archived'])
  @IsOptional()
  status?: string;
}

export class UpdateDemandEventDto {
  @ApiPropertyOptional({ example: 'Midnight Curse Festival' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-19T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional({ example: '2026-10-21T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional({ example: 3.0 })
  @IsNumber()
  @Min(0.1)
  @IsOptional()
  multiplier?: number;

  @ApiPropertyOptional({ example: ['65f1a2b3c4d5e6f7a8b9c0d1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ingredientIds?: string[];

  @ApiPropertyOptional({ enum: ['scheduled', 'active', 'expired', 'archived'] })
  @IsEnum(['scheduled', 'active', 'expired', 'archived'])
  @IsOptional()
  status?: string;
}

export class MidnightCurseSetupDto {
  @ApiProperty({
    example: ['65f1a2b3c4d5e6f7a8b9c0d1', '65f1a2b3c4d5e6f7a8b9c0d2', '65f1a2b3c4d5e6f7a8b9c0d3'],
    description: 'Exactly 3 configurable affected ingredient IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  ingredientIds!: string[];

  @ApiProperty({ example: '2026-10-19T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startAt!: string;

  @ApiProperty({ example: '2026-10-21T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  endAt!: string;

  @ApiPropertyOptional({ example: 3.0, default: 3.0 })
  @IsNumber()
  @IsOptional()
  multiplier?: number = 3.0;

  @ApiPropertyOptional({ example: 'Official Midnight Curse Festival' })
  @IsString()
  @IsOptional()
  name?: string;
}
