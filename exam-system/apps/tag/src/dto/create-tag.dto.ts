import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class ExportTemplateResponseDto {
  url: string;
  filename: string;
}

export class ImportTagDto {
  name: string;
  parentName?: string;
  description?: string;
}
