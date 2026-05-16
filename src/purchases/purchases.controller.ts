import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  async create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.purchasesService.create(dto, user);
    return PurchaseResponseDto.fromEntity(purchase);
  }

  @Get('me')
  async findMine(@CurrentUser() user: AuthUser): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchasesService.findMine(user.sub);
    return purchases.map(PurchaseResponseDto.fromEntity);
  }

  @Get('sales/me')
  async findMySales(
    @CurrentUser() user: AuthUser,
  ): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchasesService.findSalesBySeller(user.sub);
    return purchases.map(PurchaseResponseDto.fromEntity);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@CurrentUser() user: AuthUser): Promise<PurchaseResponseDto[]> {
    const purchases = await this.purchasesService.findAll(user);
    return purchases.map(PurchaseResponseDto.fromEntity);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.purchasesService.updateStatus(id, dto, user);
    return PurchaseResponseDto.fromEntity(purchase);
  }
}
