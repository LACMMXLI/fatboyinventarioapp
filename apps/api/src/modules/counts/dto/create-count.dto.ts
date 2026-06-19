import { IsOptional, IsString } from 'class-validator';

export class CreateCountDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
