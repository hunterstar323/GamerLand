import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

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
    };
  }
}