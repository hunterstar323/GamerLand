import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Busqueda por prefijo. Ejemplo: "halo" => ILIKE "halo%"',
    example: 'halo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  categoryId?: number;
}
