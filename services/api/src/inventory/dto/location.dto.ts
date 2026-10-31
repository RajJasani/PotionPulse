import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Cauldron Storage Shelf B' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'SHELF-B2' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'shelf', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
