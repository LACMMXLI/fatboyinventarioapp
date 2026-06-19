import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID('4', { message: 'ID de categoría inválido' })
  @IsOptional()
  categoryId?: string;

  @IsUUID('4', { message: 'ID de tienda inválido' })
  @IsOptional()
  storeId?: string | null;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
