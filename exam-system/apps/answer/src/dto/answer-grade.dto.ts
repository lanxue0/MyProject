import { IsNumber, IsString } from 'class-validator';

export class AnswerGradeDto {
  @IsNumber()
  id: number;

  @IsString()
  content: string;

  @IsNumber()
  objectiveScore: number;
}
