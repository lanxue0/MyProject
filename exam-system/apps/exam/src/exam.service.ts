import { RedisService } from '@app/redis';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ExamAddDto } from './dto/add-exam.dto';
import { PrismaService } from '@app/prisma';
import { ExamSaveDto } from './dto/save-exam.dto';
import { PublishExamDto } from './dto/publish-exam.dto';

@Injectable()
export class ExamService {
  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(PrismaService)
  private prismaService: PrismaService;

  async add(examAddDto: ExamAddDto, userId: number) {
    return await this.prismaService.exam.create({
      data: {
        name: examAddDto.name,
        content: '',
        createUser: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async list(userId: number, bin: string) {
    return await this.prismaService.exam.findMany({
      where:
        bin === 'true'
          ? {
              createUserId: userId,
              isDelete: true,
            }
          : {
              createUserId: userId,
              isDelete: false,
            },
    });
  }

  async delete(userId: number, id: number) {
    return await this.prismaService.exam.update({
      where: {
        id,
        createUserId: userId,
      },
      data: {
        isDelete: true,
      },
    });
  }

  async save(saveDto: ExamSaveDto) {
    // First update the exam content, hasSubjective fields and totalScore
    const exam = await this.prismaService.exam.update({
      data: {
        content: saveDto.content,
        hasSubjective: saveDto.hasSubjective,
        totalScore: saveDto.totalScore,
      },
      where: {
        id: saveDto.id,
      },
      include: {
        tags: true,
      },
    });

    // If tagIds are provided, update the exam tags
    if (saveDto.tagIds && saveDto.tagIds.length > 0) {
      // Get existing tag IDs
      const existingTagIds = exam.tags.map((tag) => tag.tagId);

      // Identify tags to remove and tags to add
      const tagsToRemove = existingTagIds.filter(
        (id) => !saveDto.tagIds.includes(id),
      );
      const tagsToAdd = saveDto.tagIds.filter(
        (id) => !existingTagIds.includes(id),
      );

      // Remove tags that are no longer associated
      if (tagsToRemove.length > 0) {
        await this.prismaService.examTag.deleteMany({
          where: {
            examId: saveDto.id,
            tagId: {
              in: tagsToRemove,
            },
          },
        });
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        await this.prismaService.examTag.createMany({
          data: tagsToAdd.map((tagId) => ({
            examId: saveDto.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return exam;
  }

  async publish(userId: number, id: number) {
    return await this.prismaService.exam.update({
      data: {
        isPublish: true,
      },
      where: {
        id,
        createUserId: userId,
      },
    });
  }

  async unpublish(userId: number, id: number) {
    return await this.prismaService.exam.update({
      data: {
        isPublish: false,
      },
      where: {
        id,
        createUserId: userId,
      },
    });
  }

  async publishToClassrooms(publishExamDto: PublishExamDto, userId: number) {
    // 验证试卷存在且属于当前用户
    const exam = await this.prismaService.exam.findFirst({
      where: {
        id: publishExamDto.examId,
        createUserId: userId,
      },
    });

    if (!exam) {
      throw new BadRequestException('试卷不存在或无权限');
    }

    // 验证试卷已发布
    if (!exam.isPublish) {
      throw new BadRequestException('试卷尚未发布，请先发布试卷');
    }

    // 创建发布记录
    const records = await Promise.all(
      publishExamDto.classroomIds.map(async (classroomId) => {
        // 检查班级是否存在
        const classroom = await this.prismaService.classroom.findUnique({
          where: {
            id: classroomId,
          },
        });

        if (!classroom) {
          throw new BadRequestException(`班级 ID ${classroomId} 不存在`);
        }

        // 检查是否已经发布过
        const existingRecord =
          await this.prismaService.examPublishRecord.findFirst({
            where: {
              examId: publishExamDto.examId,
              classroomId,
            },
          });

        if (existingRecord) {
          return existingRecord; // 已存在，直接返回
        }

        // 创建新的发布记录
        return await this.prismaService.examPublishRecord.create({
          data: {
            exam: {
              connect: {
                id: publishExamDto.examId,
              },
            },
            classroom: {
              connect: {
                id: classroomId,
              },
            },
          },
        });
      }),
    );

    return records;
  }

  async getTeacherPublishedExams(userId: number) {
    // 获取教师创建的所有已发布试卷记录
    return await this.prismaService.examPublishRecord.findMany({
      where: {
        exam: {
          createUserId: userId,
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        publishTime: 'desc',
      },
    });
  }

  async getStudentPublishedExams(userId: number) {
    // 获取学生加入的所有班级
    const classroomStudents =
      await this.prismaService.classroomStudent.findMany({
        where: {
          studentId: userId,
        },
        select: {
          classroomId: true,
        },
      });

    const classroomIds = classroomStudents.map((cs) => cs.classroomId);

    // 获取这些班级的所有已发布试卷
    return await this.prismaService.examPublishRecord.findMany({
      where: {
        classroomId: {
          in: classroomIds,
        },
      },
      include: {
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
        classroom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        publishTime: 'desc',
      },
    });
  }

  async getExamPublishRecords(examId: number) {
    // 获取指定试卷的所有发布记录
    return await this.prismaService.examPublishRecord.findMany({
      where: {
        examId,
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        publishTime: 'desc',
      },
    });
  }

  async find(id: number) {
    return await this.prismaService.exam.findUnique({
      where: {
        id,
      },
    });
  }

  async restore(userId: number, id: number) {
    try {
      return await this.prismaService.exam.update({
        where: {
          id,
          createUserId: userId,
        },
        data: {
          isDelete: false,
        },
      });
    } catch (error) {
      // 处理记录不存在的情况
      if (error.code === 'P2025') {
        return { message: '试卷已不存在或已被删除', status: 'notFound' };
      }
      throw error; // 重新抛出其他类型的错误
    }
  }

  async permanentDelete(userId: number, id: number) {
    console.log(userId, id);
    try {
      // 先删除试卷的发布记录
      await this.prismaService.examPublishRecord.deleteMany({
        where: {
          examId: id,
        },
      });

      // 删除试卷与标签的关联
      await this.prismaService.examTag.deleteMany({
        where: {
          examId: id,
        },
      });

      // 查询是否有答卷引用了这个试卷
      const answerCount = await this.prismaService.answer.count({
        where: {
          examId: id,
        },
      });

      if (answerCount > 0) {
        // 删除所有引用这个试卷的答卷
        await this.prismaService.answer.deleteMany({
          where: {
            examId: id,
          },
        });
      }

      // 然后删除试卷
      return await this.prismaService.exam.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
      // 处理记录不存在的情况
      if (error.code === 'P2025') {
        return { message: '试卷已不存在或已被删除', status: 'notFound' };
      }
      throw error; // 重新抛出其他类型的错误
    }
  }
}
