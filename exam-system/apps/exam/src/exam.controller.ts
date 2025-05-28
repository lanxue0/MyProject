import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { RequireLogin, UserInfo } from '@app/common';
import { ExamAddDto } from './dto/add-exam.dto';
import { ExamSaveDto } from './dto/save-exam.dto';
import { PublishExamDto } from './dto/publish-exam.dto';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('add')
  @RequireLogin()
  async add(
    @Body() examAddDto: ExamAddDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.examService.add(examAddDto, userId);
  }

  @Get('list')
  @RequireLogin()
  async list(@UserInfo('userId') userId: number, @Query('bin') bin: string) {
    return this.examService.list(userId, bin);
  }

  @Delete('delete/:id')
  @RequireLogin()
  async delete(@UserInfo('userId') userId: number, @Param('id') id: number) {
    return this.examService.delete(userId, +id);
  }

  @Post('save')
  @RequireLogin()
  async save(@Body() dto: ExamSaveDto) {
    return this.examService.save(dto);
  }

  @Get('publish/:id')
  @RequireLogin()
  async publish(@UserInfo('userId') userId: number, @Param('id') id: number) {
    return this.examService.publish(userId, +id);
  }

  @Get('unpublish/:id')
  @RequireLogin()
  async unpublish(@UserInfo('userId') userId: number, @Param('id') id: number) {
    return this.examService.unpublish(userId, +id);
  }

  @Post('publish-to-classrooms')
  @RequireLogin()
  async publishToClassrooms(
    @Body() publishExamDto: PublishExamDto,
    @UserInfo('userId') userId: number,
  ) {
    return this.examService.publishToClassrooms(publishExamDto, userId);
  }

  @Get('published-exams')
  @RequireLogin()
  async getPublishedExams(@UserInfo('userId') userId: number) {
    return this.examService.getTeacherPublishedExams(userId);
  }

  @Get('student-published-exams')
  @RequireLogin()
  async getStudentPublishedExams(@UserInfo('userId') userId: number) {
    return this.examService.getStudentPublishedExams(userId);
  }

  @Get('publish-records/:examId')
  @RequireLogin()
  async getExamPublishRecords(@Param('examId') examId: string) {
    return this.examService.getExamPublishRecords(parseInt(examId));
  }

  @Get('find/:id')
  @RequireLogin()
  async find(@Req() req: any, @Param('id') id: any) {
    return await this.examService.find(parseInt(id));
  }

  @Post('/restore/:id')
  @RequireLogin()
  async restore(@UserInfo('userId') userId: number, @Param('id') id: any) {
    return await this.examService.restore(userId, parseInt(id));
  }

  @Delete('/permanent/:id')
  @RequireLogin()
  async permanentDelete(
    @UserInfo('userId') userId: number,
    @Param('id') id: any,
  ) {
    return await this.examService.permanentDelete(userId, parseInt(id));
  }
}
