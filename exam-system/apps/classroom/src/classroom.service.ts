import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';

@Injectable()
export class ClassroomService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  private logger = new Logger(ClassroomService.name);

  // 生成6位随机数字作为班级代码
  private generateClassCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 创建班级
  async createClassroom(userId: number, dto: CreateClassroomDto) {
    // 检查用户是否为教师
    const userProfile = await this.prismaService.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile || userProfile.userType !== 'TEACHER') {
      throw new HttpException('只有教师可以创建班级', HttpStatus.FORBIDDEN);
    }

    try {
      // 生成唯一班级代码
      let classCode = this.generateClassCode();
      let isCodeUnique = false;

      // 确保班级代码唯一
      while (!isCodeUnique) {
        const existingClass = await this.prismaService.classroom.findUnique({
          where: { code: classCode },
        });

        if (!existingClass) {
          isCodeUnique = true;
        } else {
          classCode = this.generateClassCode();
        }
      }

      // 创建班级
      const newClass = await this.prismaService.classroom.create({
        data: {
          name: dto.name,
          description: dto.description,
          code: classCode,
          creatorId: userId,
        },
      });

      return newClass;
    } catch (error) {
      this.logger.error(`创建班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '创建班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 更新班级信息
  async updateClassroom(
    userId: number,
    classroomId: number,
    dto: UpdateClassroomDto,
  ) {
    try {
      // 检查班级是否存在且用户是否为创建者
      const classroom = await this.prismaService.classroom.findFirst({
        where: {
          id: classroomId,
          creatorId: userId,
        },
      });

      if (!classroom) {
        throw new HttpException(
          '班级不存在或您没有权限修改',
          HttpStatus.FORBIDDEN,
        );
      }

      // 更新班级信息
      const updatedClassroom = await this.prismaService.classroom.update({
        where: { id: classroomId },
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      return updatedClassroom;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`更新班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '更新班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 删除班级
  async deleteClassroom(userId: number, classroomId: number) {
    try {
      // 检查班级是否存在且用户是否为创建者
      const classroom = await this.prismaService.classroom.findFirst({
        where: {
          id: classroomId,
          creatorId: userId,
        },
      });

      if (!classroom) {
        throw new HttpException(
          '班级不存在或您没有权限删除',
          HttpStatus.FORBIDDEN,
        );
      }

      // 删除班级
      await this.prismaService.classroom.delete({
        where: { id: classroomId },
      });

      return { success: true, message: '班级已成功删除' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`删除班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '删除班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 用户加入班级（学生和非创建者教师）
  async joinClassroom(userId: number, dto: JoinClassroomDto) {
    // Check user profile
    const userProfile = await this.prismaService.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      throw new HttpException('用户信息不存在', HttpStatus.NOT_FOUND);
    }

    try {
      // 查找班级
      const classroom = await this.prismaService.classroom.findUnique({
        where: { code: dto.code },
      });

      if (!classroom) {
        throw new HttpException('班级不存在', HttpStatus.NOT_FOUND);
      }

      // 检查是否是班级创建者
      if (classroom.creatorId === userId) {
        throw new HttpException('您已是该班级的创建者', HttpStatus.BAD_REQUEST);
      }

      // 根据用户类型处理加入班级
      if (userProfile.userType === 'TEACHER') {
        // 教师加入班级逻辑
        // 检查是否已加入
        const existingTeacher =
          await this.prismaService.classroomTeacher.findUnique({
            where: {
              classroomId_teacherId: {
                classroomId: classroom.id,
                teacherId: userId,
              },
            },
          });

        if (existingTeacher) {
          throw new HttpException('您已经加入该班级', HttpStatus.BAD_REQUEST);
        }

        // 教师加入班级
        await this.prismaService.classroomTeacher.create({
          data: {
            classroomId: classroom.id,
            teacherId: userId,
          },
        });

        return { success: true, message: '成功以教师身份加入班级', classroom };
      } else {
        // 学生加入班级逻辑
        // 检查是否已加入
        const existingStudent =
          await this.prismaService.classroomStudent.findUnique({
            where: {
              classroomId_studentId: {
                classroomId: classroom.id,
                studentId: userId,
              },
            },
          });

        if (existingStudent) {
          throw new HttpException('您已经加入该班级', HttpStatus.BAD_REQUEST);
        }

        // 学生加入班级
        await this.prismaService.classroomStudent.create({
          data: {
            classroomId: classroom.id,
            studentId: userId,
          },
        });

        return { success: true, message: '成功以学生身份加入班级', classroom };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`加入班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '加入班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 学生退出班级
  async leaveClassroom(userId: number, classroomId: number) {
    try {
      // 检查是否已加入
      const existingJoin = await this.prismaService.classroomStudent.findUnique(
        {
          where: {
            classroomId_studentId: {
              classroomId: classroomId,
              studentId: userId,
            },
          },
        },
      );

      if (!existingJoin) {
        throw new HttpException('您未加入该班级', HttpStatus.BAD_REQUEST);
      }

      // 退出班级
      await this.prismaService.classroomStudent.delete({
        where: {
          classroomId_studentId: {
            classroomId: classroomId,
            studentId: userId,
          },
        },
      });

      return { success: true, message: '成功退出班级' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`退出班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '退出班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 教师移除学生
  async removeStudent(
    teacherId: number,
    classroomId: number,
    studentId: number,
  ) {
    try {
      // 检查班级是否存在且用户是否为创建者
      const classroom = await this.prismaService.classroom.findFirst({
        where: {
          id: classroomId,
          creatorId: teacherId,
        },
      });

      if (!classroom) {
        throw new HttpException(
          '班级不存在或您没有权限操作',
          HttpStatus.FORBIDDEN,
        );
      }

      // 检查学生是否在班级中
      const student = await this.prismaService.classroomStudent.findUnique({
        where: {
          classroomId_studentId: {
            classroomId: classroomId,
            studentId: studentId,
          },
        },
      });

      if (!student) {
        throw new HttpException('该学生不在班级中', HttpStatus.NOT_FOUND);
      }

      // 移除学生
      await this.prismaService.classroomStudent.delete({
        where: {
          classroomId_studentId: {
            classroomId: classroomId,
            studentId: studentId,
          },
        },
      });

      return { success: true, message: '已将学生移出班级' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`移除学生失败: ${error.message}`, error.stack);
      throw new HttpException(
        '移除学生失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 获取教师创建的班级列表
  async getTeacherClassrooms(userId: number) {
    console.log(userId);
    try {
      const classrooms = await this.prismaService.classroom.findMany({
        where: {
          creatorId: userId,
        },
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          createTime: 'desc',
        },
      });

      return classrooms.map((c) => ({
        ...c,
        studentCount: c._count.students,
        _count: undefined,
      }));
    } catch (error) {
      this.logger.error(`获取班级列表失败: ${error.message}`, error.stack);
      // 返回空数组而不是抛出异常
      return [];
    }
  }

  // 获取班级详情（包括学生列表和教师列表）
  async getClassroomDetail(userId: number, classroomId: number) {
    try {
      const classroom = await this.prismaService.classroom.findUnique({
        where: { id: classroomId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          teachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!classroom) {
        throw new HttpException('班级不存在', HttpStatus.NOT_FOUND);
      }

      // 检查权限：用户必须是创建者、教师成员或学生成员
      if (classroom.creatorId !== userId) {
        // 检查是否为加入的教师
        const isTeacher = await this.prismaService.classroomTeacher.findUnique({
          where: {
            classroomId_teacherId: {
              classroomId: classroomId,
              teacherId: userId,
            },
          },
        });

        // 检查是否为加入的学生
        const isStudent = await this.prismaService.classroomStudent.findUnique({
          where: {
            classroomId_studentId: {
              classroomId: classroomId,
              studentId: userId,
            },
          },
        });

        if (!isTeacher && !isStudent) {
          throw new HttpException('您没有权限查看此班级', HttpStatus.FORBIDDEN);
        }
      }

      // 格式化返回数据
      return {
        ...classroom,
        students: classroom.students.map((s) => ({
          id: s.student.id,
          username: s.student.username,
          email: s.student.email,
          joinTime: s.joinTime,
        })),
        teachers: classroom.teachers.map((t) => ({
          id: t.teacher.id,
          username: t.teacher.username,
          email: t.teacher.email,
          joinTime: t.joinTime,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`获取班级详情失败: ${error.message}`, error.stack);
      throw new HttpException(
        '获取班级详情失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 获取学生加入的班级列表
  async getStudentClassrooms(studentId: number) {
    try {
      const classroomStudents =
        await this.prismaService.classroomStudent.findMany({
          where: {
            studentId: studentId,
          },
          include: {
            classroom: {
              include: {
                creator: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
                _count: {
                  select: {
                    students: true,
                  },
                },
              },
            },
          },
          orderBy: {
            joinTime: 'desc',
          },
        });

      return classroomStudents.map((cs) => ({
        ...cs.classroom,
        joinTime: cs.joinTime,
        studentCount: cs.classroom._count.students,
        _count: undefined,
      }));
    } catch (error) {
      this.logger.error(`获取班级列表失败: ${error.message}`, error.stack);
      // 返回空数组而不是抛出异常
      return [];
    }
  }

  // 通过班级代码查找班级(不需要验证身份)
  async findClassroomByCode(code: string) {
    try {
      const classroom = await this.prismaService.classroom.findUnique({
        where: { code },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
      });

      if (!classroom) {
        throw new HttpException('班级不存在', HttpStatus.NOT_FOUND);
      }

      return {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        description: classroom.description,
        creator: classroom.creator,
        studentCount: classroom._count.students,
        createTime: classroom.createTime,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`查找班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '查找班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 教师退出班级（非创建者）
  async leaveTeacherClassroom(teacherId: number, classroomId: number) {
    try {
      // 检查是否已加入
      const existingTeacher =
        await this.prismaService.classroomTeacher.findUnique({
          where: {
            classroomId_teacherId: {
              classroomId: classroomId,
              teacherId: teacherId,
            },
          },
        });

      if (!existingTeacher) {
        throw new HttpException('您未加入该班级', HttpStatus.BAD_REQUEST);
      }

      // 退出班级
      await this.prismaService.classroomTeacher.delete({
        where: {
          classroomId_teacherId: {
            classroomId: classroomId,
            teacherId: teacherId,
          },
        },
      });

      return { success: true, message: '成功退出班级' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`退出班级失败: ${error.message}`, error.stack);
      throw new HttpException(
        '退出班级失败，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 获取教师加入的班级列表（非创建者）
  async getTeachingClassrooms(teacherId: number) {
    try {
      const classroomTeachers =
        await this.prismaService.classroomTeacher.findMany({
          where: {
            teacherId: teacherId,
          },
          include: {
            classroom: {
              include: {
                creator: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

      // 提取班级信息
      const classrooms = classroomTeachers.map((ct) => ({
        ...ct.classroom,
        joinTime: ct.joinTime,
      }));

      return classrooms;
    } catch (error) {
      this.logger.error(
        `获取教师加入的班级列表失败: ${error.message}`,
        error.stack,
      );
      // 返回空数组而不是抛出异常
      return [];
    }
  }
}
