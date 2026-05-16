import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];
}