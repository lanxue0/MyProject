import { PrismaService } from '@app/prisma';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class TagService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  private logger = new Logger(TagService.name);

  async create(createTagDto: CreateTagDto) {
    try {
      // If parentId is provided, verify parent exists
      if (createTagDto.parentId) {
        const parentTag = await this.prismaService.tag.findUnique({
          where: { id: createTagDto.parentId },
        });

        if (!parentTag) {
          throw new HttpException('Parent tag not found', HttpStatus.NOT_FOUND);
        }
      }

      // Create the tag
      const newTag = await this.prismaService.tag.create({
        data: createTagDto,
      });

      return newTag;
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to create tag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(parentId?: number) {
    try {
      let where = {};

      if (parentId !== undefined) {
        where = { parentId: parentId === 0 ? null : parentId };
      }

      return await this.prismaService.tag.findMany({
        where,
        include: {
          children: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to fetch tags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllHierarchical() {
    try {
      // Fetch root level tags (those without a parent)
      const rootTags = await this.prismaService.tag.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return rootTags;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to fetch hierarchical tags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const tag = await this.prismaService.tag.findUnique({
        where: { id },
        include: {
          parent: true,
          children: true,
          exams: {
            include: {
              exam: true,
            },
          },
        },
      });

      if (!tag) {
        throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
      }

      return tag;
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to fetch tag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: number, updateTagDto: UpdateTagDto) {
    try {
      // Check if tag exists
      const existingTag = await this.prismaService.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
      }

      // If updating parentId, verify it's not creating a circular reference
      if (
        updateTagDto.parentId !== undefined &&
        updateTagDto.parentId !== null
      ) {
        // Can't set parent as itself
        if (updateTagDto.parentId === id) {
          throw new HttpException(
            'Cannot set tag as its own parent',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Check for circular reference
        await this.verifyNoCircularReference(id, updateTagDto.parentId);
      }

      // Update the tag
      const updatedTag = await this.prismaService.tag.update({
        where: { id },
        data: updateTagDto,
      });

      return updatedTag;
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to update tag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      // Check if tag exists
      const existingTag = await this.prismaService.tag.findUnique({
        where: { id },
        include: {
          children: true,
          exams: true,
        },
      });

      if (!existingTag) {
        throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
      }

      // If tag has children, don't allow deletion
      if (existingTag.children.length > 0) {
        throw new HttpException(
          'Cannot delete tag with children. Move or delete children first.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Delete all exam-tag relationships first
      await this.prismaService.examTag.deleteMany({
        where: { tagId: id },
      });

      // Delete the tag
      await this.prismaService.tag.delete({
        where: { id },
      });

      return { success: true, message: 'Tag deleted successfully' };
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to delete tag',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to assign tag to an exam
  async assignTagToExam(examId: number, tagId: number) {
    try {
      // Check if exam exists
      const exam = await this.prismaService.exam.findUnique({
        where: { id: examId },
      });

      if (!exam) {
        throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
      }

      // Check if tag exists
      const tag = await this.prismaService.tag.findUnique({
        where: { id: tagId },
      });

      if (!tag) {
        throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
      }

      // Create exam-tag relationship (upsert to handle if already exists)
      await this.prismaService.examTag.upsert({
        where: {
          examId_tagId: {
            examId,
            tagId,
          },
        },
        update: {
          assignedAt: new Date(),
        },
        create: {
          examId,
          tagId,
        },
      });

      return { success: true, message: 'Tag assigned to exam successfully' };
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to assign tag to exam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to remove a tag from an exam
  async removeTagFromExam(examId: number, tagId: number) {
    try {
      // Check if relationship exists
      const examTag = await this.prismaService.examTag.findUnique({
        where: {
          examId_tagId: {
            examId,
            tagId,
          },
        },
      });

      if (!examTag) {
        throw new HttpException(
          'Tag is not assigned to this exam',
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete the relationship
      await this.prismaService.examTag.delete({
        where: {
          examId_tagId: {
            examId,
            tagId,
          },
        },
      });

      return { success: true, message: 'Tag removed from exam successfully' };
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to remove tag from exam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to get all tags for an exam
  async getExamTags(examId: number) {
    try {
      // Check if exam exists
      const exam = await this.prismaService.exam.findUnique({
        where: { id: examId },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      if (!exam) {
        throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
      }

      // Extract and return tags
      return exam.tags.map((examTag) => examTag.tag);
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Failed to get exam tags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper method to verify there's no circular reference when updating a tag's parent
  private async verifyNoCircularReference(childId: number, parentId: number) {
    // Get the potential parent tag
    const parentTag = await this.prismaService.tag.findUnique({
      where: { id: parentId },
    });

    if (!parentTag) {
      throw new HttpException('Parent tag not found', HttpStatus.NOT_FOUND);
    }

    // If parent has no parent, we're safe
    if (parentTag.parentId === null) {
      return;
    }

    // Check if parent's parent is the child (direct circular reference)
    if (parentTag.parentId === childId) {
      throw new HttpException(
        'Circular tag reference detected',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Recursively check parent's parent to catch deeper circular references
    await this.verifyNoCircularReference(childId, parentTag.parentId);
  }

  // 生成标签导入模板
  async generateExportTemplate() {
    try {
      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('标签导入模板');

      // 设置列标题
      worksheet.columns = [
        { header: '标签名称', key: 'name', width: 30 },
        { header: '父标签名称', key: 'parentName', width: 30 },
        { header: '描述', key: 'description', width: 40 },
      ];

      // 添加标题样式
      worksheet.getRow(1).font = { bold: true };

      // 添加样本数据
      worksheet.addRow({
        name: '前端开发',
        parentName: '',
        description: '前端开发相关的技术和框架',
      });

      worksheet.addRow({
        name: 'React',
        parentName: '前端开发',
        description: 'React框架相关知识',
      });

      worksheet.addRow({
        name: 'Vue',
        parentName: '前端开发',
        description: 'Vue.js框架相关知识',
      });

      // 添加使用说明行
      const helpRow = worksheet.addRow({
        name: '【使用说明】',
        parentName: '请填写父标签名称，留空表示顶级标签',
        description: '可选填写标签的详细描述',
      });
      helpRow.font = { italic: true, color: { argb: 'FF0000FF' } };

      // 生成 Buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        buffer,
        filename: '标签导入模板.xlsx',
      };
    } catch (error) {
      this.logger.error('Failed to generate tag template:', error);
      throw new HttpException(
        '生成标签导入模板失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 从Excel导入标签
  async importTagsFromExcel(
    file: Express.Multer.File,
  ): Promise<{ imported: number; errors?: string[] }> {
    try {
      // 读取Excel文件
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new HttpException('无效的Excel文件', HttpStatus.BAD_REQUEST);
      }

      const tags = [];
      const errors = [];
      const rowsToProcess = [];

      // 收集所有需要处理的行
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        console.log(row.values);
        // 跳过前五行
        if (rowNumber <= 5) return;

        // 将行数据保存，以便后续顺序处理
        rowsToProcess.push({
          rowNumber,
          values: row.values,
        });
      });
      console.log(rowsToProcess);

      // 处理每一行数据
      for (const { rowNumber, values } of rowsToProcess) {
        try {
          const name = values[1]?.toString().trim();
          const parentName = values[2]?.toString().trim();
          const description = values[3]?.toString().trim();

          if (!name) {
            errors.push(`第${rowNumber}行：标签名称不能为空`);
            continue;
          }

          // 创建标签对象
          const tagData: CreateTagDto = {
            name,
          };

          // 如果有描述信息，添加到标签数据中
          if (description) {
            tagData['description'] = description;
          }

          // 如果指定了父标签，查找父标签ID
          if (parentName) {
            const parentTag = await this.prismaService.tag.findFirst({
              where: { name: parentName },
            });

            if (!parentTag) {
              errors.push(`第${rowNumber}行：未找到父标签 "${parentName}"`);
              continue;
            }

            tagData.parentId = parentTag.id;
          }

          // 检查标签是否已存在
          const existingTag = await this.prismaService.tag.findFirst({
            where: { name },
          });

          if (existingTag) {
            // 如果标签已存在，更新父标签和描述
            const updateData: any = {};

            if (existingTag.parentId !== tagData.parentId) {
              updateData.parentId = tagData.parentId;
            }

            if (description && existingTag['description'] !== description) {
              updateData.description = description;
            }

            // 只有有更新数据时才执行更新
            if (Object.keys(updateData).length > 0) {
              await this.prismaService.tag.update({
                where: { id: existingTag.id },
                data: updateData,
              });
            }

            tags.push(existingTag);
          } else {
            // 创建新标签
            const newTag = await this.prismaService.tag.create({
              data: tagData,
            });
            tags.push(newTag);
          }
        } catch (error) {
          this.logger.error(`Error processing row ${rowNumber}:`, error);
          errors.push(`第${rowNumber}行：处理出错 - ${error.message}`);
        }
      }

      // 返回导入结果
      return {
        imported: tags.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to import tags:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('导入标签失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
