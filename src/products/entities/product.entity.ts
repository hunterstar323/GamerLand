import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PurchaseDetail } from '../../purchases/entities/purchase-detail.entity';

@Entity({ name: 'productos' })
export class Product {
  @PrimaryGeneratedColumn({ name: 'producto_id' })
  id!: number;

  @Column({ name: 'usuario_id' })
  ownerId!: number;

  @Column({ name: 'nombre', length: 150 })
  name!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'precio',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  price!: number;

  @Column({ name: 'cantidad', type: 'int' })
  quantity!: number;

  @Column({ name: 'imagen', type: 'text', nullable: true })
  image!: string | null;

  @ManyToOne(() => User, (user) => user.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  owner!: User;

  @OneToMany(() => PurchaseDetail, (detail) => detail.product)
  purchaseDetails!: PurchaseDetail[];
}