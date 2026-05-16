import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Purchase } from './purchase.entity';

@Entity({ name: 'compra_detalle' })
export class PurchaseDetail {
  @PrimaryGeneratedColumn({ name: 'detalle_id' })
  id!: number;

  @Column({ name: 'compra_id' })
  purchaseId!: number;

  @Column({ name: 'producto_id' })
  productId!: number;

  @Column({ name: 'cantidad', type: 'int' })
  quantity!: number;

  @Column({
    name: 'precio_unitario',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  unitPrice!: number;

  @ManyToOne(() => Purchase, (purchase) => purchase.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compra_id' })
  purchase!: Purchase;

  @ManyToOne(() => Product, (product) => product.purchaseDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  product!: Product;
}