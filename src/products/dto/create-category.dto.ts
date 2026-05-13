import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsIn(['0', '1'])
  swMayoriaEdad!: '0' | '1';
}
