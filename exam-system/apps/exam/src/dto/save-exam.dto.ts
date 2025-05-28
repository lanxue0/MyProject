import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class ExamSaveDto {
  @IsNotEmpty({ message: '考试 id 不能为空' })
  id: number;
  @IsString()
  content: string;
  @IsBoolean()
  hasSubjective: boolean;
  @IsNumber()
  totalScore: number;
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
