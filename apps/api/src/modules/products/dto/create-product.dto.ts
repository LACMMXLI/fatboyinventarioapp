import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  name: string;

  @IsUUID('4', { message: 'ID de categoría inválido' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  categoryId: string;

  @IsUUID('4', { message: 'ID de tienda inválido' })
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsNotEmpty({ message: 'La unidad de medida es requerida' })
  unit: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
