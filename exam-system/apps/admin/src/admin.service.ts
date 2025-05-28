import { PrismaService } from '@app/prisma';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class AdminService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  private logger = new Logger(AdminService.name);

  // Check if user is admin
  async checkAdmin(userId: number) {
    try {
      const userProfile = await this.prismaService.userProfile.findUnique({
        where: { userId },
      });

      if (!userProfile || userProfile.userType !== 'ADMIN') {
        throw new HttpException(
          'Unauthorized: Not an admin',
          HttpStatus.FORBIDDEN,
        );
      }

      return { isAdmin: true };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to check admin status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // User Management
  async getUsers(adminId: number, page: number, pageSize: number) {
    await this.checkAdmin(adminId);

    try {
      const skip = (page - 1) * pageSize;
      const users = await this.prismaService.user.findMany({
        skip,
        take: pageSize,
        include: {
          profile: true,
        },
      });

      const total = await this.prismaService.user.count();

      return {
        data: users.map((user) => {
          const { password, ...rest } = user;
          return rest;
        }),
        pagination: {
          current: page,
          pageSize,
          total,
        },
      };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to get users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(
    adminId: number,
    userId: number,
    updateUserDto: UpdateUserDto,
  ) {
    await this.checkAdmin(adminId);

    try {
      const userProfile = await this.prismaService.userProfile.findUnique({
        where: { userId },
      });

      if (!userProfile) {
        throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
      }

      const updatedProfile = await this.prismaService.userProfile.update({
        where: { userId },
        data: {
          gender: updateUserDto.gender || userProfile.gender,
          userType: updateUserDto.userType || userProfile.userType,
          bio:
            updateUserDto.bio !== undefined
              ? updateUserDto.bio
              : userProfile.bio,
          region:
            updateUserDto.region !== undefined
              ? updateUserDto.region
              : userProfile.region,
          birthDate: updateUserDto.birthDate || userProfile.birthDate,
        },
      });

      return updatedProfile;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserType(userId: number, userType: 'STUDENT' | 'TEACHER') {
    try {
      const profile = await this.prismaService.userProfile.update({
        where: { userId },
        data: {
          userType,
        },
      });

      return profile;
    } catch (error) {
      this.logger.error(`更新用户 ${userId} 类型失败:`, error);
      throw new Error('更新用户类型失败');
    }
  }

  // Exam Management
  async getExams(
    adminId: number,
    page: number,
    pageSize: number,
    creator?: string,
    sortBy?: string,
    hasSubjective?: boolean,
  ) {
    await this.checkAdmin(adminId);

    try {
      const skip = (page - 1) * pageSize;

      // Build filter conditions
      const where: any = {
        isDelete: false,
      };

      if (creator) {
        where.createUser = {
          username: {
            contains: creator,
          },
        };
      }

      if (hasSubjective !== undefined) {
        where.hasSubjective = hasSubjective;
      }

      // Build sort conditions
      const orderBy: any = {};
      if (sortBy === 'createTime') {
        orderBy.createTime = 'desc';
      } else if (sortBy === 'updateTime') {
        orderBy.updateTime = 'desc';
      }

      const exams = await this.prismaService.exam.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          createUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      const total = await this.prismaService.exam.count({ where });

      return {
        data: exams,
        pagination: {
          current: page,
          pageSize,
          total,
        },
      };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to get exams',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteExam(adminId: number, examId: number) {
    await this.checkAdmin(adminId);

    try {
      const exam = await this.prismaService.exam.findUnique({
        where: { id: examId },
      });

      if (!exam) {
        throw new HttpException('Exam not found', HttpStatus.NOT_FOUND);
      }

      // Soft delete
      await this.prismaService.exam.update({
        where: { id: examId },
        data: { isDelete: true },
      });

      return { success: true };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to delete exam',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Answer Management
  async getAnswers(
    adminId: number,
    page: number,
    pageSize: number,
    creator?: string,
    examCreator?: string,
    sortByScore?: string,
    isGraded?: boolean,
  ) {
    await this.checkAdmin(adminId);

    try {
      const skip = (page - 1) * pageSize;

      // Build filter conditions
      const where: any = {};

      if (creator) {
        where.answerer = {
          username: {
            contains: creator,
          },
        };
      }

      if (examCreator) {
        where.exam = {
          createUser: {
            username: {
              contains: examCreator,
            },
          },
        };
      }

      if (isGraded !== undefined) {
        where.isGraded = isGraded;
      }

      // Build sort conditions
      const orderBy: any = {};
      if (sortByScore === 'asc') {
        orderBy.score = 'asc';
      } else if (sortByScore === 'desc') {
        orderBy.score = 'desc';
      } else {
        orderBy.createTime = 'desc';
      }

      const answers = await this.prismaService.answer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          answerer: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          exam: {
            select: {
              id: true,
              name: true,
              createUser: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      const total = await this.prismaService.answer.count({ where });

      return {
        data: answers,
        pagination: {
          current: page,
          pageSize,
          total,
        },
      };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to get answers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteAnswer(adminId: number, answerId: number) {
    await this.checkAdmin(adminId);

    try {
      const answer = await this.prismaService.answer.findUnique({
        where: { id: answerId },
      });

      if (!answer) {
        throw new HttpException('Answer not found', HttpStatus.NOT_FOUND);
      }

      await this.prismaService.answer.delete({
        where: { id: answerId },
      });

      return { success: true };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        'Failed to delete answer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Tag Management
  async getTags(adminId: number, parentId?: number) {
    await this.checkAdmin(adminId);

    try {
      let where = {};

      if (parentId !== undefined) {
        where = { parentId: parentId === 0 ? null : parentId };
      }

      return await this.prismaService.tag.findMany({
        where,
        include: {
          children: true,
          exams: {
            include: {
              exam: true,
            },
          },
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

  async getTagsHierarchical(adminId: number) {
    await this.checkAdmin(adminId);

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
          exams: {
            include: {
              exam: true,
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

  async getTag(adminId: number, id: number) {
    await this.checkAdmin(adminId);

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

  async createTag(adminId: number, createTagDto: CreateTagDto) {
    await this.checkAdmin(adminId);

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

  async updateTag(adminId: number, id: number, updateTagDto: UpdateTagDto) {
    await this.checkAdmin(adminId);

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

  async deleteTag(adminId: number, id: number) {
    await this.checkAdmin(adminId);

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

  async batchDeleteTags(adminId: number, ids: number[]) {
    await this.checkAdmin(adminId);

    try {
      const results = {
        success: [] as number[],
        failed: [] as Array<{ id: number; reason: string }>,
      };

      // 检查每个标签并批量删除
      for (const id of ids) {
        try {
          // 检查标签是否存在
          const existingTag = await this.prismaService.tag.findUnique({
            where: { id },
            include: {
              children: true,
              exams: true,
            },
          });

          if (!existingTag) {
            results.failed.push({ id, reason: '标签不存在' });
            continue;
          }

          // 如果标签有子标签，不允许删除
          if (existingTag.children.length > 0) {
            results.failed.push({
              id,
              reason: '无法删除有子标签的标签，请先删除或移动其子标签',
            });
            continue;
          }

          // 首先删除所有与标签相关的试卷关联
          await this.prismaService.examTag.deleteMany({
            where: { tagId: id },
          });

          // 删除标签
          await this.prismaService.tag.delete({
            where: { id },
          });

          results.success.push(id);
        } catch (error) {
          this.logger.error(`Failed to delete tag ${id}:`, error);
          results.failed.push({ id, reason: '删除失败' });
        }
      }

      return {
        success: true,
        message: `成功删除 ${results.success.length} 个标签，失败 ${results.failed.length} 个`,
        details: results,
      };
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        '批量删除标签失败',
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

  async getQuestionsPaginated(page = 1, pageSize = 10) {
    const [questions, total] = await Promise.all([
      this.prismaService.question.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          creator: {
            select: {
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createTime: 'desc',
        },
      }),
      this.prismaService.question.count(),
    ]);

    return {
      items: questions.map((question) => ({
        ...question,
        tags: question.tags.map((tag) => tag.tag),
      })),
      total,
    };
  }

  async deleteQuestion(id: number) {
    return await this.prismaService.question.delete({
      where: { id },
    });
  }

  async batchDeleteQuestions(ids: number[]) {
    try {
      const results = {
        success: [] as number[],
        failed: [] as Array<{ id: number; reason: string }>,
      };

      for (const id of ids) {
        try {
          // 检查题目是否存在
          const question = await this.prismaService.question.findUnique({
            where: { id },
          });

          if (!question) {
            results.failed.push({ id, reason: '题目不存在' });
            continue;
          }

          // 删除题目与标签的关联
          await this.prismaService.questionTag.deleteMany({
            where: { questionId: id },
          });

          // 删除题目
          await this.prismaService.question.delete({
            where: { id },
          });

          results.success.push(id);
        } catch (error) {
          this.logger.error(`Failed to delete question ${id}:`, error);
          results.failed.push({ id, reason: '删除失败' });
        }
      }

      return {
        success: true,
        message: `成功删除 ${results.success.length} 个题目，失败 ${results.failed.length} 个`,
        details: results,
      };
    } catch (e) {
      this.logger.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        '批量删除题目失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createQuestion(userId: number, createQuestionDto: any) {
    const { tagIds, ...questionData } = createQuestionDto;

    // 创建问题
    const question = await this.prismaService.question.create({
      data: {
        ...questionData,
        creatorId: userId,
      },
    });

    // 如果有标签，创建问题-标签关联
    if (tagIds && tagIds.length > 0) {
      await this.prismaService.questionTag.createMany({
        data: tagIds.map((tagId: number) => ({
          questionId: question.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }

    return question;
  }

  async updateQuestion(id: number, updateQuestionDto: any) {
    const { tagIds, ...questionData } = updateQuestionDto;

    // 更新问题基本信息
    const question = await this.prismaService.question.update({
      where: { id },
      data: questionData,
    });

    // 如果提供了标签，更新标签关联
    if (tagIds !== undefined) {
      // 删除所有现有标签关联
      await this.prismaService.questionTag.deleteMany({
        where: { questionId: id },
      });

      // 创建新的标签关联
      if (tagIds.length > 0) {
        await this.prismaService.questionTag.createMany({
          data: tagIds.map((tagId: number) => ({
            questionId: id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return question;
  }
}
