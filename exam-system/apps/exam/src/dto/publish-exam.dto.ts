import { IsArray, IsNumber, IsPositive } from 'class-validator';

export class PublishExamDto {
  @IsNumber()
  @IsPositive()
  examId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  classroomIds: number[];
}
