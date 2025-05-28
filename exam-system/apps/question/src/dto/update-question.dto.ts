import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsEnum(['radio', 'checkbox', 'input', 'judge', 'essay'], {
    message: '题目类型必须是单选题、多选题、填空题、判断题或主观题之一',
  })
  type?: string;

  @IsOptional()
  @IsString({ message: '题目内容必须是字符串' })
  question?: string;

  @IsOptional()
  @IsString({ message: '选项必须是字符串' })
  options?: string;

  @IsOptional()
  @IsInt({ message: '分值必须是整数' })
  @Min(1, { message: '分值必须大于0' })
  score?: number;

  @IsOptional()
  @IsString({ message: '答案必须是字符串' })
  answer?: string;

  @IsOptional()
  @IsString({ message: '答案解析必须是字符串' })
  answerAnalyse?: string;

  @IsOptional()
  @IsInt({ message: '难度必须是整数' })
  @Min(0, { message: '难度必须在0-5之间' })
  difficulty?: number;

  @IsOptional()
  @IsArray({ message: '标签ID必须是数组' })
  @IsInt({ each: true, message: '标签ID必须是整数' })
  tagIds?: number[];
}
