import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(
    dto: CreateProductDto,
    currentUser: AuthUser,
  ): Promise<Product> {
    const categories = await this.resolveCategories(dto.categoryIds);
    this.assertUserCanUseCategories(categories, currentUser);

    const product = this.productsRepository.create({
      ownerId: currentUser.sub,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      quantity: dto.quantity,
      image: dto.image ?? null,
      categories,
    });

    return this.productsRepository.save(product);
  }

  findAll(filters: ListProductsQueryDto = {}): Promise<Product[]> {
    return this.buildListQuery(filters).getMany();
  }

  findMine(userId: number, filters: ListProductsQueryDto = {}): Promise<Product[]> {
    return this.buildListQuery(filters)
      .andWhere('product.ownerId = :ownerId', { ownerId: userId })
      .getMany();
  }

  async findCategories(): Promise<
    Array<{ id: number; name: string; swMayoriaEdad: '0' | '1' }>
  > {
    const categories = await this.categoriesRepository.find({
      order: { name: 'ASC' },
    });

    return categories.map((category) => this.mapCategoryResponse(category));
  }

  async createCategory(
    dto: CreateCategoryDto,
    currentUser: AuthUser,
  ): Promise<{ id: number; name: string; swMayoriaEdad: '0' | '1' }> {
    this.assertAdmin(currentUser);

    const category = this.categoriesRepository.create({
      name: dto.name.trim(),
      swMayoriaEdad: dto.swMayoriaEdad,
    });

    const saved = await this.categoriesRepository.save(category);
    return this.mapCategoryResponse(saved);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { owner: true, categories: true },
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

    const categories =
      dto.categoryIds !== undefined
        ? await this.resolveCategories(dto.categoryIds)
        : product.categories;

    if (dto.categoryIds !== undefined) {
      this.assertUserCanUseCategories(categories, currentUser);
    }

    Object.assign(product, {
      name: dto.name ?? product.name,
      description:
        dto.description !== undefined ? dto.description : product.description,
      price: dto.price ?? product.price,
      quantity: dto.quantity ?? product.quantity,
      image: dto.image !== undefined ? dto.image : product.image,
      categories,
    });

    return this.productsRepository.save(product);
  }

  async remove(id: number, currentUser: AuthUser): Promise<void> {
    const product = await this.findOne(id);
    this.assertCanManageProduct(product, currentUser);
    await this.productsRepository.remove(product);
  }

  async updateCategory(
    id: number,
    dto: UpdateCategoryDto,
    currentUser: AuthUser,
  ): Promise<{ id: number; name: string; swMayoriaEdad: '0' | '1' }> {
    this.assertAdmin(currentUser);

    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    if (dto.name !== undefined) {
      category.name = dto.name.trim();
    }

    if (dto.swMayoriaEdad !== undefined) {
      category.swMayoriaEdad = dto.swMayoriaEdad;
    }

    await this.categoriesRepository.save(category);

    return this.mapCategoryResponse(category);
  }

  async removeCategory(id: number, currentUser: AuthUser): Promise<void> {
    this.assertAdmin(currentUser);

    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { products: true },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    const relatedProductIds = (category.products ?? []).map((product) => product.id);

    if (relatedProductIds.length) {
      await this.productsRepository
        .createQueryBuilder()
        .relation(Product, 'categories')
        .of(relatedProductIds)
        .remove(category.id);
    }

    await this.categoriesRepository.remove(category);
  }

  private assertAdmin(currentUser: AuthUser): void {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo los administradores pueden gestionar categorías.',
      );
    }
  }

  private mapCategoryResponse(category: Category): {
    id: number;
    name: string;
    swMayoriaEdad: '0' | '1';
  } {
    return {
      id: category.id,
      name: category.name,
      swMayoriaEdad: category.swMayoriaEdad,
    };
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

  private buildListQuery(filters: ListProductsQueryDto) {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.owner', 'owner')
      .leftJoinAndSelect('product.categories', 'category')
      .orderBy('product.id', 'DESC')
      .distinct(true);

    if (filters.search?.trim()) {
      query.andWhere('product.name ILIKE :search', {
        search: `${filters.search.trim()}%`,
      });
    }

    if (filters.categoryId) {
      query.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    return query;
  }

  private async resolveCategories(categoryIds?: number[]): Promise<Category[]> {
    if (!categoryIds?.length) {
      return [];
    }

    const uniqueIds = [...new Set(categoryIds)];
    const categories = await this.categoriesRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (categories.length !== uniqueIds.length) {
      throw new BadRequestException('Una o más categorías no existen.');
    }

    return categories;
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

  private assertUserCanUseCategories(
    categories: Category[],
    currentUser: AuthUser,
  ): void {
    const hasAdultCategory = categories.some(
      (category) => category.swMayoriaEdad === '1',
    );

    if (hasAdultCategory && !this.isAdult(currentUser.birthDate)) {
      throw new ForbiddenException(
        'Debes ser mayor de 18 años para asignar categorías de contenido +18.',
      );
    }
  }
}