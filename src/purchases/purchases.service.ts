import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
import { PurchaseStatus } from './enums/purchase-status.enum';
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
        swEstado: PurchaseStatus.PAID,
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

  findSalesBySeller(userId: number): Promise<Purchase[]> {
    return this.purchasesRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.buyer', 'buyer')
      .leftJoinAndSelect('purchase.details', 'detail')
      .leftJoinAndSelect('detail.product', 'product')
      .where('product.ownerId = :userId', { userId })
      .orderBy('purchase.id', 'DESC')
      .getMany();
  }

  findAll(currentUser: AuthUser): Promise<Purchase[]> {
    this.assertAdmin(currentUser);

    return this.purchasesRepository.find({
      relations: {
        buyer: true,
        details: {
          product: true,
        },
      },
      order: { id: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    dto: UpdatePurchaseStatusDto,
    currentUser: AuthUser,
  ): Promise<Purchase> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id },
      relations: {
        buyer: true,
        details: {
          product: true,
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Compra no encontrada.');
    }

    this.assertCanUpdateStatus(purchase, dto.swEstado, currentUser);

    purchase.swEstado = dto.swEstado;
    await this.purchasesRepository.save(purchase);

    return purchase;
  }

  private assertCanUpdateStatus(
    purchase: Purchase,
    nextStatus: PurchaseStatus,
    currentUser: AuthUser,
  ): void {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isBuyer = purchase.buyerId === currentUser.sub;
    const isSeller = purchase.details.some(
      (detail) => detail.product.ownerId === currentUser.sub,
    );

    if (isAdmin) {
      return;
    }

    if (nextStatus === PurchaseStatus.DELIVERED && isBuyer) {
      return;
    }

    if (nextStatus === PurchaseStatus.CANCELED && (isBuyer || isSeller)) {
      return;
    }

    throw new ForbiddenException(
      'No tienes permiso para cambiar la compra a ese estado.',
    );
  }

  private assertAdmin(currentUser: AuthUser): void {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo los administradores pueden gestionar estados de compras.',
      );
    }
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
