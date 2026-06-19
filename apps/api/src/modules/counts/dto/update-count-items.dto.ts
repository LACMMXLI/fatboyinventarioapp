import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CountItemInputDto {
  @IsUUID('4', { message: 'ID de producto inválido' })
  @IsNotEmpty()
  productId: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'La cantidad debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  quantity: number;
}

export class UpdateCountItemsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CountItemInputDto)
  items: CountItemInputDto[];
}
