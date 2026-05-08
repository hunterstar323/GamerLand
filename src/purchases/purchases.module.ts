import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { PurchaseDetail } from './entities/purchase-detail.entity';
import { Purchase } from './entities/purchase.entity';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseDetail, Product])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}