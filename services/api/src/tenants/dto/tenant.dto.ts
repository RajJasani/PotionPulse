import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { UserRole } from '@potionpulse/contracts';

export class CreateTenantDto {
  @ApiProperty({ example: "Hexley's Second Cauldron" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'UTC', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'metric', required: false })
  @IsString()
  @IsOptional()
  unitSystem?: string;
}

export class UpdateTenantSettingsDto {
  @ApiProperty({ example: "Hexley's Premium Elixirs", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'UTC', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  allowNegativeStock?: boolean;

  @ApiProperty({ example: 7, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultSafetyStockDays?: number;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'apprentice@potionpulse.dev' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.MANAGER })
  @IsEnum(UserRole)
  role!: UserRole;
}
