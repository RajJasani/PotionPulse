import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeIngredientDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiProperty({ example: 4, description: 'Required quantity for base yield' })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiPropertyOptional({ example: 'pieces' })
  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Midnight Curse Ward Draught' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Festival' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'A potent nocturnal brew formulated to resist the midnight curse' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  version?: number;

  @ApiProperty({ example: 10, default: 10 })
  @IsNumber()
  @Min(0.1)
  baseYield = 10;

  @ApiPropertyOptional({ example: 'bottles', default: 'bottles' })
  @IsString()
  @IsOptional()
  yieldUnit?: string;

  @ApiPropertyOptional({ example: 45, default: 30 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  preparationTimeMinutes?: number;

  @ApiProperty({ type: [RecipeIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];

  @ApiPropertyOptional({ example: ['Boil Distilled Aether', 'Crush Bat Wings and steep', 'Seal in amber flask'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @ApiPropertyOptional({ example: 45.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  suggestedRetailPrice?: number;
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'Midnight Curse Ward Draught' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Festival' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Updated brew formulation notes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0.1)
  @IsOptional()
  baseYield?: number;

  @ApiPropertyOptional({ example: 'bottles' })
  @IsString()
  @IsOptional()
  yieldUnit?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  preparationTimeMinutes?: number;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  @IsOptional()
  ingredients?: RecipeIngredientDto[];

  @ApiPropertyOptional({ example: ['Updated step 1', 'Updated step 2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  instructions?: string[];

  @ApiPropertyOptional({ example: 50.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  suggestedRetailPrice?: number;
}

export class ExecuteProductionBatchDto {
  @ApiProperty({ example: 2.0, default: 1.0, description: 'Scale factor for batch size (e.g. 2.0 = double batch)' })
  @IsNumber()
  @Min(0.01)
  scaleFactor = 1.0;

  @ApiPropertyOptional({ example: 20, description: 'Actual yield produced (defaults to expected yield)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualYield?: number;

  @ApiPropertyOptional({
    description: 'Optional recorded ingredient wastage during brewing',
    example: [{ ingredientId: '65f1a2b3c4d5e6f7a8b9c0d1', wastageQty: 0.5 }],
  })
  @IsArray()
  @IsOptional()
  wastage?: Array<{ ingredientId: string; wastageQty: number }>;

  @ApiPropertyOptional({ example: 'Standard cauldron brew batch' })
  @IsString()
  @IsOptional()
  notes?: string;
}
