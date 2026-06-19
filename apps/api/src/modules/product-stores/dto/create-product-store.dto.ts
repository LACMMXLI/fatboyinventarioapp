import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la tienda es requerido' })
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
