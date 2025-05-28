import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AnswerService } from './answer.service';
import { ClientProxy } from '@nestjs/microservices';
import { RequireLogin, UserInfo } from '@app/common';
import { AnswerAddDto } from './dto/answer-add.dto';
import { ExcelService } from '@app/excel';
import { AnswerGradeDto } from './dto/answer-grade.dto';

@Controller('answer')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Inject('EXAM_SERVICE')
  private examClient: ClientProxy;

  @Post('add')
  @RequireLogin()
  async add(@Body() addDto: AnswerAddDto, @UserInfo('userId') userId: number) {
    return this.answerService.add(addDto, userId);
  }

  // 查找某个考试的所有答卷
  @Get('list')
  @RequireLogin()
  async list(@Query('examId') examId: string) {
    if (!examId) {
      throw new BadRequestException('examId 不能为空');
    }
    return this.answerService.list(+examId);
  }

  //查找某个userId的所有答卷
  @Get('listByUserId')
  @RequireLogin()
  async listByUserId(@UserInfo('userId') userId: number) {
    if (!userId) {
      throw new BadRequestException('userId 不能为空');
    }
    return this.answerService.listByUserId(+userId);
  }

  @Get('find/:id')
  @RequireLogin()
  async find(@Param('id') id: number) {
    return this.answerService.find(+id);
  }

  @Inject(ExcelService)
  private excelService: ExcelService;

  @Get('export')
  async export(@Query('examId') examId: string) {
    if (!examId) {
      throw new BadRequestException('examId 不能为空');
    }

    const data = await this.answerService.list(+examId);
    console.log(data);
    const columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: '分数', key: 'score', width: 30 },
      { header: '答题人', key: 'answerer', width: 30 },
      { header: '试卷', key: 'exam', width: 30 },
      { header: '创建时间', key: 'createTime', width: 30 },
    ];

    const res = data.map((item) => {
      return {
        id: item.id,
        score: item.score,
        answerer: item.answerer.username,
        exam: item.exam.name,
        createTime: item.createTime,
      };
    });

    return this.excelService.export(columns, res, 'answers.xlsx');
  }

  @Get('pending-answer-list')
  @RequireLogin()
  async getPendingAnswers(@UserInfo('userId') userId: number) {
    return this.answerService.getPendingAnswers(userId);
  }

  @Post(':id/grade')
  @RequireLogin()
  async grade(@Param('id') id: string, @Body() gradeDto: AnswerGradeDto) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    return this.answerService.grade(gradeDto);
  }
}
