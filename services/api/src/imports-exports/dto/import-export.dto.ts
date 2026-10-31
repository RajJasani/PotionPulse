import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportCsvDto {
  @ApiProperty({
    example: 'name,sku,category,baseUnit,currentStock,costPerUnit,leadTimeDays,safetyStock\nBat Wings,BW-01,Reagents,pieces,180,1.20,5,75\nMandrake Root,MR-01,Herbs,roots,65,4.50,7,35',
    description: 'Raw CSV text with header row',
  })
  @IsString()
  @IsNotEmpty()
  rawCsv!: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'If true, parses and validates without modifying database' })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean = false;

  @ApiPropertyOptional({ example: false, default: false, description: 'If true, updates existing ingredients matching SKU' })
  @IsBoolean()
  @IsOptional()
  overwriteDuplicates?: boolean = false;
}
