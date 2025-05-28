import { Inject, Injectable } from '@nestjs/common';
import { AnswerAddDto } from './dto/answer-add.dto';
import { PrismaService } from '@app/prisma';
import { AnswerGradeDto } from './dto/answer-grade.dto';

@Injectable()
export class AnswerService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  async add(addDto: AnswerAddDto, userId: number) {
    const exam = await this.prismaService.exam.findUnique({
      where: {
        id: addDto.examId,
      },
    });

    let questions = [];
    try {
      questions = JSON.parse(exam.content);
    } catch {}

    let answers = [];
    try {
      answers = JSON.parse(addDto.content);
    } catch {}

    let totalScore = 0;
    let correctCount = 0;
    let accuracy = 0;

    answers.forEach((answer) => {
      const question = questions.find((item) => item.id === answer.id);
      if (!question) return;

      if (question.type === 'input') {
        if (answer.answer.includes(question.answer)) {
          totalScore += question.score;
          correctCount++;
        }
      } else if (question.type === 'essay') {
        return;
      } else {
        if (answer.answer === question.answer) {
          totalScore += question.score;
          correctCount++;
        }
      }
    });

    accuracy = questions.length > 0 ? correctCount / questions.length : 0;

    return await this.prismaService.answer.create({
      data: {
        content: addDto.content,
        score: totalScore,
        acuracy: exam.hasSubjective ? 0 : accuracy,
        isGraded: !exam.hasSubjective,
        answerer: {
          connect: {
            id: userId,
          },
        },
        exam: {
          connect: {
            id: addDto.examId,
          },
        },
      },
    });
  }

  async list(examId: number) {
    return await this.prismaService.answer.findMany({
      where: {
        examId,
      },
      include: {
        exam: true,
        answerer: true,
      },
    });
  }

  async listByUserId(userId: number) {
    const answers = await this.prismaService.answer.findMany({
      where: {
        answererId: userId,
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            totalScore: true,
          },
        },
      },
      orderBy: {
        createTime: 'desc',
      },
    });

    return answers.map((answer) => ({
      id: answer.id,
      name: answer.exam.name,
      examId: answer.exam.id,
      score: answer.score,
      createTime: answer.createTime,
      accuracy: answer.acuracy,
      isGraded: answer.isGraded,
      totalScore: answer.exam.totalScore,
    }));
  }

  async find(id: number) {
    return await this.prismaService.answer.findUnique({
      where: {
        id,
      },
      include: {
        exam: true,
        answerer: true,
      },
    });
  }

  async getPendingAnswers(userId: number) {
    return await this.prismaService.answer.findMany({
      where: {
        exam: {
          createUserId: userId,
        },
        isGraded: false,
      },
      include: {
        exam: {
          select: {
            name: true,
          },
        },
        answerer: {
          select: {
            username: true,
          },
        },
      },
    });
  }

  async grade(gradeDto: AnswerGradeDto) {
    const answer = await this.prismaService.answer.findUnique({
      where: {
        id: gradeDto.id,
      },
      include: {
        exam: true,
      },
    });

    if (!answer) {
      throw new Error('答卷不存在');
    }

    let questions = [];
    try {
      questions = JSON.parse(answer.exam.content);
    } catch {}

    let answers = [];
    try {
      answers = JSON.parse(gradeDto.content);
    } catch {}

    // 计算主观题总分
    const subjectiveScore = answers
      .filter((a) => {
        const question = questions.find((q) => q.id === a.id);
        return question && question.type === 'essay';
      })
      .reduce((sum, a) => sum + (a.score || 0), 0);

    // 计算总分（客观题分数 + 主观题分数）
    const totalScore = answer.score + subjectiveScore;
    const accuracy = totalScore / 100;

    return await this.prismaService.answer.update({
      where: {
        id: gradeDto.id,
      },
      data: {
        content: gradeDto.content,
        score: totalScore,
        acuracy: accuracy,
        isGraded: true,
      },
    });
  }
}
