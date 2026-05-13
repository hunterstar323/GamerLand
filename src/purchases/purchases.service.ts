import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseDetail } from './entities/purchase-detail.entity';
import { Purchase } from './entities/purchase.entity';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Purchase)
    private readonly purchasesRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreatePurchaseDto, currentUser: AuthUser): Promise<Purchase> {
    const buyer = await this.usersRepository.findOne({
      where: { id: currentUser.sub },
    });

    if (!buyer) {
      throw new NotFoundException('Usuario comprador no encontrado.');
    }

    const buyerIsAdult = this.isAdult(buyer.birthDate);
    const productIds = dto.items.map((item) => item.productId);
    const uniqueIds = [...new Set(productIds)];

    if (uniqueIds.length !== productIds.length) {
      throw new BadRequestException('No repitas productos dentro de la compra.');
    }

    const products = await this.productsRepository.find({
      where: { id: In(uniqueIds) },
      relations: { owner: true, categories: true },
    });

    if (products.length !== uniqueIds.length) {
      throw new NotFoundException('Uno o más productos no existen.');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new NotFoundException('Producto no encontrado.');
      }

      if (product.ownerId === currentUser.sub) {
        throw new BadRequestException('No puedes comprar tus propios productos.');
      }

      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${product.name}.`,
        );
      }

      const requiresAdult = product.categories.some(
        (category) => category.swMayoriaEdad === '1',
      );

      if (requiresAdult && !buyerIsAdult) {
        throw new BadRequestException(
          `Debes ser mayor de edad para comprar ${product.name}.`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      let total = 0;

      const purchase = manager.create(Purchase, {
        buyerId: currentUser.sub,
        purchaseDate: new Date(),
        total: 0,
      });

      const savedPurchase = await manager.save(Purchase, purchase);

      const details: PurchaseDetail[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        total += product.price * item.quantity;

        product.quantity -= item.quantity;
        await manager.save(Product, product);

        details.push(
          manager.create(PurchaseDetail, {
            purchaseId: savedPurchase.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
          }),
        );
      }

      await manager.save(PurchaseDetail, details);

      savedPurchase.total = Number(total.toFixed(2));
      await manager.save(Purchase, savedPurchase);

      return manager.findOneOrFail(Purchase, {
        where: { id: savedPurchase.id },
        relations: {
          buyer: true,
          details: {
            product: true,
          },
        },
      });
    });
  }

  findMine(userId: number): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { buyerId: userId },
      relations: {
        buyer: true,
        details: {
          product: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  private isAdult(birthDateIso: string): boolean {
    const birthDate = new Date(birthDateIso);

    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age >= 18;
  }
}