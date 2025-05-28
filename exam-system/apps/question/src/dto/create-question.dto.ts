import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateQuestionDto {
  @IsNotEmpty({ message: '题目类型不能为空' })
  @IsEnum(['radio', 'checkbox', 'input', 'judge', 'essay'], {
    message: '题目类型必须是单选题、多选题、填空题、判断题或主观题之一',
  })
  type: string;

  @IsNotEmpty({ message: '题目内容不能为空' })
  @IsString({ message: '题目内容必须是字符串' })
  question: string;

  @IsOptional()
  @IsString({ message: '选项必须是字符串' })
  options?: string;

  @IsNotEmpty({ message: '分值不能为空' })
  @IsInt({ message: '分值必须是整数' })
  @Min(1, { message: '分值必须大于0' })
  score: number;

  @IsNotEmpty({ message: '答案不能为空' })
  @IsString({ message: '答案必须是字符串' })
  answer: string;

  @IsNotEmpty({ message: '答案解析不能为空' })
  @IsString({ message: '答案解析必须是字符串' })
  answerAnalyse: string;

  @IsNotEmpty({ message: '难度不能为空' })
  @IsInt({ message: '难度必须是整数' })
  @Min(0, { message: '难度必须在0-5之间' })
  difficulty: number;

  @IsOptional()
  @IsArray({ message: '标签ID必须是数组' })
  @IsInt({ each: true, message: '标签ID必须是整数' })
  tagIds?: number[];
}
