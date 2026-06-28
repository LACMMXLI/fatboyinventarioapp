import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '@inventarioapp/shared';

export class RegisterDto {
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

  @IsIn([UserRole.ADMIN, UserRole.ENCARGADO], {
    message: 'Solo se permite registrar Administrador o Encargado',
  })
  role: typeof UserRole.ADMIN | typeof UserRole.ENCARGADO;

  @IsUUID('4', { message: 'ID de sucursal inválido' })
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty({ message: 'El código de invitación es requerido' })
  invitationCode: string;
}
