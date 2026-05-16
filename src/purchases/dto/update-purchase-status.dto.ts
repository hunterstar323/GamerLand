import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PurchaseStatus } from '../enums/purchase-status.enum';

export class UpdatePurchaseStatusDto {
  @ApiProperty({
    enum: PurchaseStatus,
    description: '0 = pagado, 1 = entregado, 2 = cancelado',
  })
  @IsEnum(PurchaseStatus)
  swEstado!: PurchaseStatus;
}
