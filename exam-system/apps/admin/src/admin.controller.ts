import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequireLogin, UserInfo } from '@app/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management
  @Get('users')
  @RequireLogin()
  async getUsers(
    @UserInfo('userId') adminId: number,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.adminService.getUsers(adminId, +page, +pageSize);
  }

  @Post('users/:id')
  @RequireLogin()
  async updateUser(
    @UserInfo('userId') adminId: number,
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(adminId, +userId, updateUserDto);
  }

  // Exam Management
  @Get('exams')
  @RequireLogin()
  async getExams(
    @UserInfo('userId') adminId: number,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('creator') creator?: string,
    @Query('sortBy') sortBy?: string,
    @Query('hasSubjective') hasSubjective?: string,
  ) {
    return this.adminService.getExams(
      adminId,
      +page,
      +pageSize,
      creator,
      sortBy,
      hasSubjective === 'true',
    );
  }

  @Delete('exams/:id')
  @RequireLogin()
  async deleteExam(
    @UserInfo('userId') adminId: number,
    @Param('id') examId: string,
  ) {
    return this.adminService.deleteExam(adminId, +examId);
  }

  // Answer Management
  @Get('answers')
  @RequireLogin()
  async getAnswers(
    @UserInfo('userId') adminId: number,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('creator') creator?: string,
    @Query('examCreator') examCreator?: string,
    @Query('sortByScore') sortByScore?: string,
    @Query('isGraded') isGraded?: string,
  ) {
    // Only convert isGraded to boolean if it's actually provided
    let isGradedValue: boolean | undefined = undefined;
    if (isGraded !== undefined) {
      isGradedValue = isGraded === 'true';
    }

    return this.adminService.getAnswers(
      adminId,
      +page,
      +pageSize,
      creator,
      examCreator,
      sortByScore,
      isGradedValue,
    );
  }

  @Delete('answers/:id')
  @RequireLogin()
  async deleteAnswer(
    @UserInfo('userId') adminId: number,
    @Param('id') answerId: string,
  ) {
    return this.adminService.deleteAnswer(adminId, +answerId);
  }

  // Tag Management
  @Get('tags')
  @RequireLogin()
  async getTags(
    @UserInfo('userId') adminId: number,
    @Query('parentId') parentId?: string,
  ) {
    const parentIdNum = parentId ? parseInt(parentId, 10) : undefined;
    return this.adminService.getTags(adminId, parentIdNum);
  }

  @Get('tags/hierarchical')
  @RequireLogin()
  async getTagsHierarchical(@UserInfo('userId') adminId: number) {
    return this.adminService.getTagsHierarchical(adminId);
  }

  @Get('tags/:id')
  @RequireLogin()
  async getTag(@UserInfo('userId') adminId: number, @Param('id') id: string) {
    return this.adminService.getTag(adminId, +id);
  }

  @Post('tags')
  @RequireLogin()
  async createTag(
    @UserInfo('userId') adminId: number,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.adminService.createTag(adminId, createTagDto);
  }

  @Put('tags/:id')
  @RequireLogin()
  async updateTag(
    @UserInfo('userId') adminId: number,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.adminService.updateTag(adminId, +id, updateTagDto);
  }

  @Delete('tags/:id')
  @RequireLogin()
  async deleteTag(
    @UserInfo('userId') adminId: number,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteTag(adminId, +id);
  }

  @Post('tags/batch-delete')
  @RequireLogin()
  async batchDeleteTags(
    @UserInfo('userId') adminId: number,
    @Body() ids: number[],
  ) {
    return this.adminService.batchDeleteTags(adminId, ids);
  }

  // Check if user is admin
  @Get('check')
  @RequireLogin()
  async checkAdmin(@UserInfo('userId') userId: number) {
    return this.adminService.checkAdmin(userId);
  }

  @Get('questions')
  @RequireLogin()
  async getQuestions(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return await this.adminService.getQuestionsPaginated(
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
  }

  @Post('questions')
  @RequireLogin()
  async createQuestion(
    @UserInfo('userId') userId: number,
    @Body() createQuestionDto: any,
  ) {
    return await this.adminService.createQuestion(userId, createQuestionDto);
  }

  @Put('questions/:id')
  @RequireLogin()
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuestionDto: any,
  ) {
    return await this.adminService.updateQuestion(+id, updateQuestionDto);
  }

  @Delete('questions/:id')
  @RequireLogin()
  async deleteQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuestion(+id);
  }

  @Post('questions/batch-delete')
  @RequireLogin()
  async batchDeleteQuestions(@Body() ids: number[]) {
    return this.adminService.batchDeleteQuestions(ids);
  }
}
