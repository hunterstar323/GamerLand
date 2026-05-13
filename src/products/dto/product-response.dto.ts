import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

class ProductCategoryResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['0', '1'] })
  swMayoriaEdad!: '0' | '1';
}

export class ProductResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  ownerId!: number;

  @ApiProperty()
  ownerName!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional()
  image!: string | null;

  @ApiProperty({ type: [ProductCategoryResponseDto] })
  categories!: ProductCategoryResponseDto[];

  @ApiProperty()
  isAdultOnly!: boolean;

  static fromEntity(product: Product): ProductResponseDto {
    return {
      id: product.id,
      ownerId: product.ownerId,
      ownerName: product.owner?.name ?? '',
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      image: product.image,
      categories: (product.categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        swMayoriaEdad: category.swMayoriaEdad,
      })),
      isAdultOnly: (product.categories ?? []).some(
        (category) => category.swMayoriaEdad === '1',
      ),
    };
  }
}