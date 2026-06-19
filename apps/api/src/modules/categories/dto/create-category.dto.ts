import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es requerido' })
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
