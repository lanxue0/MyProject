import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinClassroomDto {
  @IsNotEmpty({ message: '班级代码不能为空' })
  @IsString({ message: '班级代码必须是字符串' })
  @Length(6, 6, { message: '班级代码必须是6位' })
  code: string;
}
