import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateClassroomDto {
  @IsNotEmpty({ message: '班级名称不能为空' })
  @IsString({ message: '班级名称必须是字符串' })
  @Length(2, 100, { message: '班级名称长度需在2-100个字符之间' })
  name: string;

  @IsOptional()
  @IsString({ message: '班级描述必须是字符串' })
  description?: string;
}
