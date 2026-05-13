import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'categorias' })
export class Category {
  @PrimaryGeneratedColumn({ name: 'categoria_id' })
  id!: number;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'sw_mayoria_edad', type: 'varchar', length: 1, default: '0' })
  swMayoriaEdad!: '0' | '1';

  @ManyToMany(() => Product, (product) => product.categories)
  products!: Product[];
}
