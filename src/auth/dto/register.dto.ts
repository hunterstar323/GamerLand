import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '2000-01-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}