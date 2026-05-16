import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PurchaseStatus } from '../enums/purchase-status.enum';
import { PurchaseDetail } from './purchase-detail.entity';

@Entity({ name: 'compras' })
export class Purchase {
  @PrimaryGeneratedColumn({ name: 'compra_id' })
  id!: number;

  @Column({ name: 'comprador_id' })
  buyerId!: number;

  @Column({ name: 'fecha_compra', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  purchaseDate!: Date;

  @Column({
    name: 'sw_estado',
    type: 'varchar',
    length: 1,
    default: PurchaseStatus.PAID,
  })
  swEstado!: PurchaseStatus;

  @Column({
    name: 'total',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  total!: number;

  @ManyToOne(() => User, (user) => user.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comprador_id' })
  buyer!: User;

  @OneToMany(() => PurchaseDetail, (detail) => detail.purchase, {
    cascade: true,
  })
  details!: PurchaseDetail[];
}
