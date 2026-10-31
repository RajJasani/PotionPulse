import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'hexley@potionpulse.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SuperSecret123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Madam Hexley' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: "Hexley's Apothecary", required: false })
  @IsString()
  @IsOptional()
  shopName?: string;
}
