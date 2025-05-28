import { RequireLogin } from '@app/common';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagService } from './tag.service';
import { Response } from 'express';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @RequireLogin()
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Get()
  async findAll(@Query('parentId') parentId?: string) {
    const parentIdNum = parentId ? parseInt(parentId, 10) : undefined;
    return this.tagService.findAll(parentIdNum);
  }

  @Get('hierarchical')
  async findAllHierarchical() {
    return this.tagService.findAllHierarchical();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tagService.findOne(+id);
  }

  @Put(':id')
  @RequireLogin()
  async update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(+id, updateTagDto);
  }

  @Delete(':id')
  @RequireLogin()
  async remove(@Param('id') id: string) {
    return this.tagService.remove(+id);
  }

  @Post('exam/:examId/tag/:tagId')
  @RequireLogin()
  async assignTagToExam(
    @Param('examId') examId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagService.assignTagToExam(+examId, +tagId);
  }

  @Delete('exam/:examId/tag/:tagId')
  @RequireLogin()
  async removeTagFromExam(
    @Param('examId') examId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagService.removeTagFromExam(+examId, +tagId);
  }

  @Get('exam/:examId/tags')
  async getExamTags(@Param('examId') examId: string) {
    return this.tagService.getExamTags(+examId);
  }

  @Get('export/template')
  @RequireLogin()
  async exportTemplate(@Res() res: Response) {
    const result = await this.tagService.generateExportTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tag-template.xlsx"`,
    );
    res.send(result.buffer);
  }

  @Post('import')
  @RequireLogin()
  @UseInterceptors(FileInterceptor('file'))
  async importTags(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imported: number; errors?: string[] }> {
    return this.tagService.importTagsFromExcel(file);
  }
}
