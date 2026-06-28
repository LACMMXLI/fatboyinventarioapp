import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateInvitationCodesDto {
  @IsString()
  @MinLength(4, { message: 'El código de administradores debe tener al menos 4 caracteres' })
  @IsNotEmpty({ message: 'El código de administradores es requerido' })
  adminInvitationCode: string;

  @IsString()
  @MinLength(4, { message: 'El código de encargados debe tener al menos 4 caracteres' })
  @IsNotEmpty({ message: 'El código de encargados es requerido' })
  encargadoInvitationCode: string;
}
