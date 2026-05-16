import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(['0', '1'])
  swMayoriaEdad?: '0' | '1';
}
