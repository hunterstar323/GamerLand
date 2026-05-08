import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
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
}