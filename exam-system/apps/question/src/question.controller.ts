import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { RequireLogin, UserInfo } from '@app/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Response } from 'express';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post('create')
  @RequireLogin()
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.questionService.create(createQuestionDto, userId);
  }

  @Get('list')
  @RequireLogin()
  async list(
    @UserInfo('userId') userId: number,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('difficulty') difficulty: string,
    @Query('type') type: string,
    @Query('tagId') tagId: string,
  ) {
    return await this.questionService.list(
      userId,
      page ? +page : 1,
      pageSize ? +pageSize : 10,
      difficulty,
      type,
      tagId ? +tagId : undefined,
    );
  }

  @Get('find/:id')
  @RequireLogin()
  async find(@Param('id') id: string) {
    return await this.questionService.find(+id);
  }

  @Put('update/:id')
  @RequireLogin()
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.questionService.update(+id, updateQuestionDto, userId);
  }

  @Delete('delete/:id')
  @RequireLogin()
  async delete(@Param('id') id: string, @UserInfo('userId') userId: number) {
    return await this.questionService.delete(+id, userId);
  }

  @Post('upload')
  @RequireLogin()
  @UseInterceptors(FileInterceptor('file'))
  async uploadQuestions(
    @UploadedFile() file: Express.Multer.File,
    @UserInfo('userId') userId: number,
  ) {
    return await this.questionService.processExcelUpload(file, userId);
  }

  @Get('template')
  async getTemplate(@Res() res: Response) {
    const result = await this.questionService.generateExcelTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="template.xlsx"`,
    );
    res.send(result.buffer);
  }

  @Get('auto-generate')
  @RequireLogin()
  async autoGenerate(
    @UserInfo('userId') userId: number,
    @Query('difficulty') difficulty: string,
    @Query('totalCount') totalCount: string,
    @Query('radioCount') radioCount: string,
    @Query('checkboxCount') checkboxCount: string,
    @Query('inputCount') inputCount: string,
    @Query('judgeCount') judgeCount: string,
    @Query('essayCount') essayCount: string,
    @Query('tagIds') tagIds: string,
  ) {
    const tagIdsArray = tagIds ? tagIds.split(',').map((id) => +id) : [];
    const difficultyNum = difficulty ? parseInt(difficulty, 10) : 2;

    return await this.questionService.autoGenerateExam(
      userId,
      difficultyNum,
      +totalCount,
      +radioCount,
      +checkboxCount,
      +inputCount,
      +judgeCount,
      +essayCount,
      tagIdsArray,
    );
  }
}
