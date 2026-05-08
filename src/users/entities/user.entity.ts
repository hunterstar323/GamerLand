import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Product } from '../../products/entities/product.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';

@Entity({ name: 'system_usuarios' })
export class User {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  id!: number;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'correo', length: 100, unique: true })
  email!: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', default: () => 'CURRENT_DATE' })
  birthDate!: string;

  @Column({
    name: 'tipo_usuario',
    type: 'varchar',
    length: 1,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ name: 'fecha_registro', type: 'date' })
  registeredAt!: string;

  @Exclude()
  @Column({ name: 'password', length: 100 })
  password!: string;

  @OneToMany(() => Product, (product) => product.owner)
  products!: Product[];

  @OneToMany(() => Purchase, (purchase) => purchase.buyer)
  purchases!: Purchase[];
}