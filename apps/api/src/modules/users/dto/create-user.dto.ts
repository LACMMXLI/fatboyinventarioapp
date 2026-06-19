import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '@inventarioapp/shared';

export class CreateUserDto {
  @IsEmail({}, { message: 'Ingresa un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @IsEnum(UserRole, { message: 'Rol inválido. Usa: ADMIN, ENCARGADO o CONSULTA' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: UserRole;

  @IsUUID('4', { message: 'ID de sucursal inválido' })
  @IsOptional()
  branchId?: string;
}
