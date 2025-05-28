import { IsOptional } from 'class-validator';
export class UpdateUserProfileDto {
  @IsOptional()
  gender?: string;

  @IsOptional()
  birthDate?: Date;

  @IsOptional()
  bio?: string;

  @IsOptional()
  region?: string;
}
