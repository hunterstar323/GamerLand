import { ApiProperty } from '@nestjs/swagger';
import { Purchase } from '../entities/purchase.entity';

class PurchaseProductSnapshotDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  image!: string | null;
}

class PurchaseItemResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  productId!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty({ type: PurchaseProductSnapshotDto })
  product!: PurchaseProductSnapshotDto;
}

export class PurchaseResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  buyerId!: number;

  @ApiProperty()
  buyerName!: string;

  @ApiProperty()
  purchaseDate!: Date;

  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [PurchaseItemResponseDto] })
  items!: PurchaseItemResponseDto[];

  static fromEntity(purchase: Purchase): PurchaseResponseDto {
    return {
      id: purchase.id,
      buyerId: purchase.buyerId,
      buyerName: purchase.buyer?.name ?? '',
      purchaseDate: purchase.purchaseDate,
      total: purchase.total,
      items: purchase.details.map((detail) => ({
        id: detail.id,
        productId: detail.productId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        product: {
          id: detail.product.id,
          name: detail.product.name,
          image: detail.product.image,
        },
      })),
    };
  }
}