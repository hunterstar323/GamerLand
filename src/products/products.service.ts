import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(
    dto: CreateProductDto,
    currentUser: AuthUser,
  ): Promise<Product> {
    const product = this.productsRepository.create({
      ownerId: currentUser.sub,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      quantity: dto.quantity,
      image: dto.image ?? null,
    });

    return this.productsRepository.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: { owner: true },
      order: { id: 'DESC' },
    });
  }

  findMine(userId: number): Promise<Product[]> {
    return this.productsRepository.find({
      where: { ownerId: userId },
      relations: { owner: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { owner: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return product;
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    currentUser: AuthUser,
  ): Promise<Product> {
    const product = await this.findOne(id);
    this.assertCanManageProduct(product, currentUser);

    Object.assign(product, {
      name: dto.name ?? product.name,
      description:
        dto.description !== undefined ? dto.description : product.description,
      price: dto.price ?? product.price,
      quantity: dto.quantity ?? product.quantity,
      image: dto.image !== undefined ? dto.image : product.image,
    });

    return this.productsRepository.save(product);
  }

  async remove(id: number, currentUser: AuthUser): Promise<void> {
    const product = await this.findOne(id);
    this.assertCanManageProduct(product, currentUser);
    await this.productsRepository.remove(product);
  }

  private assertCanManageProduct(product: Product, currentUser: AuthUser): void {
    const isOwner = product.ownerId === currentUser.sub;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este producto.',
      );
    }
  }
}