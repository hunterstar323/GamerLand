import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll(query);
    return products.map(ProductResponseDto.fromEntity);
  }

  @Get('categories')
  async findCategories(): Promise<
    Array<{ id: number; name: string; swMayoriaEdad: '0' | '1' }>
  > {
    return this.productsService.findCategories();
  }

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: number; name: string; swMayoriaEdad: '0' | '1' }> {
    return this.productsService.createCategory(dto, user);
  }

  @Put('categories/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: number; name: string; swMayoriaEdad: '0' | '1' }> {
    return this.productsService.updateCategory(id, dto, user);
  }

  @Delete('categories/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeCategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.productsService.removeCategory(id, user);
    return { message: 'Categoría eliminada correctamente.' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findMine(
    @CurrentUser() user: AuthUser,
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findMine(user.sub, query);
    return products.map(ProductResponseDto.fromEntity);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return ProductResponseDto.fromEntity(product);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(dto, user);
    const fullProduct = await this.productsService.findOne(product.id);
    return ProductResponseDto.fromEntity(fullProduct);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, dto, user);
    return ProductResponseDto.fromEntity(product);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<{ message: string }> {
    await this.productsService.remove(id, user);
    return { message: 'Producto eliminado correctamente.' };
  }
}