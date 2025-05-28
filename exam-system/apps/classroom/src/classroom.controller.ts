import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { RequireLogin, UserInfo } from '@app/common';

@Controller('classroom')
@RequireLogin()
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  // 教师创建班级
  @Post('create')
  async createClassroom(
    @UserInfo('userId') userId: number,
    @Body() createClassroomDto: CreateClassroomDto,
  ) {
    return this.classroomService.createClassroom(userId, createClassroomDto);
  }

  // 教师更新班级信息
  @Put(':id')
  async updateClassroom(
    @UserInfo('userId') userId: number,
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ) {
    return this.classroomService.updateClassroom(
      userId,
      parseInt(id),
      updateClassroomDto,
    );
  }

  // 教师删除班级
  @Delete(':id')
  async deleteClassroom(
    @UserInfo('userId') userId: number,
    @Param('id') id: string,
  ) {
    return this.classroomService.deleteClassroom(userId, parseInt(id));
  }

  // 学生加入班级
  @Post('join')
  async joinClassroom(
    @UserInfo('userId') userId: number,
    @Body() joinClassroomDto: JoinClassroomDto,
  ) {
    return this.classroomService.joinClassroom(userId, joinClassroomDto);
  }

  // 学生退出班级
  @Delete('leave/:id')
  async leaveClassroom(
    @UserInfo('userId') userId: number,
    @Param('id') id: string,
  ) {
    return this.classroomService.leaveClassroom(userId, parseInt(id));
  }

  // 教师移除学生
  @Delete(':id/student/:studentId')
  async removeStudent(
    @UserInfo('userId') userId: number,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classroomService.removeStudent(
      userId,
      parseInt(id),
      parseInt(studentId),
    );
  }

  // 获取教师创建的班级列表
  @Get('teacher')
  async getTeacherClassrooms(@UserInfo('userId') userId: number) {
    console.log('userId', userId);
    return this.classroomService.getTeacherClassrooms(userId);
  }

  // 获取教师加入的班级列表（非创建者）
  @Get('teaching')
  async getTeachingClassrooms(@UserInfo('userId') userId: number) {
    return this.classroomService.getTeachingClassrooms(userId);
  }

  // 教师退出班级（非创建者）
  @Delete('leave-teacher/:id')
  async leaveTeacherClassroom(
    @UserInfo('userId') userId: number,
    @Param('id') id: string,
  ) {
    return this.classroomService.leaveTeacherClassroom(userId, parseInt(id));
  }

  // 获取学生加入的班级列表
  @Get('student')
  async getStudentClassrooms(@UserInfo('userId') userId: number) {
    return this.classroomService.getStudentClassrooms(userId);
  }

  // 获取班级详情
  @Get(':id')
  async getClassroomDetail(
    @UserInfo('userId') userId: number,
    @Param('id') id: string,
  ) {
    return this.classroomService.getClassroomDetail(userId, parseInt(id));
  }

  // 通过班级代码查找班级
  @Get('code/:code')
  async findClassroomByCode(@Param('code') code: string) {
    return this.classroomService.findClassroomByCode(code);
  }
}
