import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class QuestionService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 创建题目
  async create(createQuestionDto: CreateQuestionDto, userId: number) {
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
        data: tagIds.map((tagId) => ({
          questionId: question.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }

    return question;
  }

  // 查询题目列表
  async list(
    userId: number,
    page: number,
    pageSize: number,
    difficulty?: string,
    type?: string,
    tagId?: number,
  ) {
    const where: any = {
      creatorId: userId,
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (type) {
      where.type = type;
    }

    // 获取带分页的问题列表
    const [questions, total] = await Promise.all([
      this.prismaService.question.findMany({
        where: tagId
          ? {
              ...where,
              tags: {
                some: {
                  tagId,
                },
              },
            }
          : where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createTime: 'desc',
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prismaService.question.count({
        where: tagId
          ? {
              ...where,
              tags: {
                some: {
                  tagId,
                },
              },
            }
          : where,
      }),
    ]);

    return {
      items: questions.map((question) => ({
        ...question,
        tags: question.tags.map((tag) => tag.tag),
      })),
      total,
    };
  }

  // 获取单个题目详情
  async find(id: number) {
    const question = await this.prismaService.question.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!question) {
      throw new HttpException('题目不存在', HttpStatus.NOT_FOUND);
    }

    return {
      ...question,
      tags: question.tags.map((tag) => tag.tag),
    };
  }

  // 更新题目
  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    userId: number,
  ) {
    const { tagIds, ...questionData } = updateQuestionDto;

    // 检查题目是否存在且属于当前用户
    const existingQuestion = await this.prismaService.question.findFirst({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (!existingQuestion) {
      throw new HttpException('题目不存在或无权限', HttpStatus.FORBIDDEN);
    }

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
          data: tagIds.map((tagId) => ({
            questionId: id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return question;
  }

  // 删除题目
  async delete(id: number, userId: number) {
    // 检查题目是否存在且属于当前用户
    const existingQuestion = await this.prismaService.question.findFirst({
      where: {
        id,
        creatorId: userId,
      },
    });

    if (!existingQuestion) {
      throw new HttpException('题目不存在或无权限', HttpStatus.FORBIDDEN);
    }

    return await this.prismaService.question.delete({
      where: { id },
    });
  }

  // 处理Excel上传
  async processExcelUpload(file: Express.Multer.File, userId: number) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new HttpException('无效的Excel文件', HttpStatus.BAD_REQUEST);
    }

    // 创建类型映射（中文 -> 英文代码）
    const typeMapReverse = {
      单选题: 'radio',
      多选题: 'checkbox',
      填空题: 'input',
      判断题: 'judge',
      主观题: 'essay',
    };

    // 难度直接使用0-5的数值
    const questions = [];
    const errors = [];
    const rowsToProcess = [];

    // 收集所有需要处理的行
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // 跳过前4行（标题行、两个样本数据行、说明行）
      if (rowNumber <= 4) return;

      // 将行数据保存，以便后续顺序处理
      rowsToProcess.push({
        rowNumber,
        values: [1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
          row.getCell(i).value?.toString().trim(),
        ),
      });
    });

    // 顺序处理每一行，等待上一行处理完成后再处理下一行
    for (const { rowNumber, values } of rowsToProcess) {
      try {
        const [
          typeCell,
          question,
          options,
          score,
          answer,
          answerAnalyse,
          difficultyCell,
          tagNames,
        ] = values;

        // 检查是否为空行
        if (!typeCell && !question) {
          continue; // 跳过空行
        }

        if (!typeCell || !question) {
          errors.push(`第${rowNumber}行：题目类型和问题内容必填`);
          continue;
        }

        // 将中文题型转换为英文代码
        const type = typeMapReverse[typeCell] || typeCell;

        // 验证题目类型
        const validTypes = ['radio', 'checkbox', 'input', 'judge', 'essay'];
        if (!validTypes.includes(type)) {
          errors.push(
            `第${rowNumber}行：无效的题目类型，必须是单选题、多选题、填空题、判断题或主观题之一`,
          );
          continue;
        }

        // 处理难度值，将其转换为0-5之间的整数
        let difficulty = 2; // 默认中等难度
        if (difficultyCell) {
          if (/^[0-5]$/.test(difficultyCell)) {
            // 是0-5的数字
            difficulty = parseInt(difficultyCell, 10);
          } else {
            // 兼容旧版本
            switch (difficultyCell) {
              case 'easy':
                difficulty = 1;
                break;
              case 'medium':
                difficulty = 2;
                break;
              case 'hard':
                difficulty = 4;
                break;
              default:
                errors.push(
                  `第${rowNumber}行：无效的难度，必须是0-5之间的数字`,
                );
                continue;
            }
          }
        }

        // 处理标签
        const tagIds = [];
        if (tagNames) {
          const tags = tagNames.split(',').map((tag) => tag.trim());

          for (const tagName of tags) {
            // 查找现有标签或创建新标签
            const tag = await this.prismaService.tag.findFirst({
              where: { name: tagName },
            });

            if (tag) {
              tagIds.push(tag.id);
            } else {
              const newTag = await this.prismaService.tag.create({
                data: { name: tagName },
              });
              tagIds.push(newTag.id);
            }
          }
        }

        // 创建问题
        const newQuestion = await this.create(
          {
            type,
            question,
            options: options || null,
            score: parseInt(score) || 5,
            answer: answer || '',
            answerAnalyse: answerAnalyse || '',
            difficulty,
            tagIds,
          },
          userId,
        );

        questions.push(newQuestion);
      } catch (error) {
        errors.push(`第${rowNumber}行：处理出错 - ${error.message}`);
      }
    }

    return {
      success: questions.length > 0,
      imported: questions.length,
      errors: errors.length > 0 ? errors : null,
      questions,
    };
  }

  // 生成Excel模板
  async generateExcelTemplate() {
    console.log('开始生成模板');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('题目导入模板');

    // 设置列标题
    worksheet.columns = [
      { header: '题目类型', key: 'type', width: 15 },
      { header: '题目内容', key: 'question', width: 40 },
      { header: '选项', key: 'options', width: 30 },
      { header: '分值', key: 'score', width: 10 },
      { header: '答案', key: 'answer', width: 20 },
      { header: '答案解析', key: 'answerAnalyse', width: 30 },
      { header: '难度', key: 'difficulty', width: 10 },
      { header: '标签', key: 'tags', width: 20 },
    ];

    // 添加标题样式
    worksheet.getRow(1).font = { bold: true };

    // 添加样本数据
    worksheet.addRow({
      type: 'radio',
      question: '最高的山是?',
      options: '珠穆朗玛峰,喜马拉雅山,昆仑山',
      score: 5,
      answer: '珠穆朗玛峰',
      answerAnalyse: '珠穆朗玛峰是世界最高峰',
      difficulty: '2', // 中等难度，使用数字2表示
      tags: '地理,常识',
    });

    worksheet.addRow({
      type: 'checkbox',
      question: '以下哪些是高山?',
      options: '珠穆朗玛峰,喜马拉雅山,泰山',
      score: 5,
      answer: '珠穆朗玛峰,喜马拉雅山',
      answerAnalyse: '珠穆朗玛峰和喜马拉雅山都是高山',
      difficulty: '4', // 困难，使用数字4表示
      tags: '地理,高山',
    });

    // 添加使用说明行
    const helpRow = worksheet.addRow({
      type: '【使用说明】',
      question: '点击单元格查看下拉列表',
      options: '多个选项用英文逗号分隔',
      score: '',
      answer: '与选项格式一致',
      answerAnalyse: '',
      difficulty: '0-5(由易到难)',
      tags: '多个标签用英文逗号分隔',
    });

    // 设置说明行样式
    helpRow.font = { italic: true, color: { argb: '666666' } };
    helpRow.height = 20;

    // 为题目类型添加中文下拉列表
    // 创建类型映射
    const typeMap = {
      radio: '单选题',
      checkbox: '多选题',
      input: '填空题',
      judge: '判断题',
      essay: '主观题',
    };

    // 在样本行修改显示为中文
    worksheet.getCell('A2').value = typeMap['radio']; // 第一个样本
    worksheet.getCell('A3').value = typeMap['checkbox']; // 第二个样本

    // 添加题目类型下拉选项（中文显示）
    worksheet.getCell('A5:A1000').dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"单选题,多选题,填空题,判断题,主观题"'],
      showErrorMessage: true,
      errorStyle: 'error',
      error: '请从列表中选择有效的题目类型',
    };

    // 添加难度下拉选项（0-5数字）
    worksheet.getCell('G5:G1000').dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"0,1,2,3,4,5"'],
      showErrorMessage: true,
      errorStyle: 'error',
      error: '请选择0-5之间的难度值，0表示最简单，5表示最难',
    };

    // 从数据库获取所有标签
    const tags = await this.prismaService.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // 如果有标签，为标签列创建下拉列表
    if (tags.length > 0) {
      // 将标签名称组合成字符串，用逗号分隔
      const tagNames = tags.map((tag) => tag.name).join(',');

      // 为标签列添加数据验证（下拉列表）
      worksheet.getCell('H5:H1000').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${tagNames}"`], // 使用双引号包裹逗号分隔的标签列表
        showErrorMessage: true,
        errorStyle: 'warning',
        error: '请从列表中选择已有标签，或输入新标签（多个标签用英文逗号分隔）',
      };
    }

    // 添加处理说明注释
    worksheet.getCell('H1').note = {
      texts: [
        { text: '标签填写说明:\n', font: { bold: true } },
        { text: '1. 可从下拉列表选择已有标签\n' },
        { text: '2. 也可以直接输入新标签\n' },
        { text: '3. 多个标签请用英文逗号分隔，如：标签1,标签2' },
      ],
    };

    // 添加难度说明注释
    worksheet.getCell('G1').note = {
      texts: [
        { text: '难度说明:\n', font: { bold: true } },
        { text: '0: 非常简单\n' },
        { text: '1: 简单\n' },
        { text: '2: 中等偏易\n' },
        { text: '3: 中等偏难\n' },
        { text: '4: 困难\n' },
        { text: '5: 非常困难' },
      ],
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer,
      filename: '题目导入模板.xlsx',
    };
  }

  // 自动组卷 - 使用遗传算法
  async autoGenerateExam(
    userId: number,
    difficulty: number,
    totalCount: number,
    radioCount: number,
    checkboxCount: number,
    inputCount: number,
    judgeCount: number,
    essayCount: number,
    tagIds: number[],
  ) {
    console.log(radioCount, checkboxCount, inputCount, judgeCount, essayCount);
    // 验证题目总数 - 确保使用整数进行比较
    const actualTotal = Math.round(
      Number(radioCount) +
        Number(checkboxCount) +
        Number(inputCount) +
        Number(judgeCount) +
        Number(essayCount),
    );
    const totalCountInt = Math.round(Number(totalCount));

    console.log(`验证总数: 实际总和=${actualTotal}, 目标总数=${totalCountInt}`);

    if (actualTotal !== totalCountInt) {
      throw new HttpException(
        `各题型数量之和(${actualTotal})必须等于总题目数量(${totalCountInt})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 获取所有可能的题目池
    const questionPool = await this.getQuestionPool(userId, difficulty, tagIds);

    // 检查是否有足够的题目来生成试卷
    if (questionPool.length < totalCount) {
      throw new HttpException(
        `题库中只有${questionPool.length}道题目，无法生成包含${totalCount}道题目的试卷`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 定义各类型题目的目标数量
    const typeTargets = {
      radio: Number(radioCount),
      checkbox: Number(checkboxCount),
      input: Number(inputCount),
      judge: Number(judgeCount),
      essay: Number(essayCount),
    };

    // 运行遗传算法生成最优试卷
    const generatedQuestions = this.runGeneticAlgorithm(
      questionPool,
      typeTargets,
      difficulty,
      tagIds,
      totalCount,
    );

    // 将问题转换为前端所需格式
    return generatedQuestions.map((q) => ({
      id: new Date().getTime() + q.id, // 生成唯一ID
      type: q.type,
      question: q.question,
      options: q.options ? this.safeParseJSON(q.options) : undefined,
      score: q.score,
      answer: q.answer,
      answerAnalyse: q.answerAnalyse,
      isSubjective: q.type === 'essay',
    }));
  }

  // 获取符合基本条件的题目池
  private async getQuestionPool(
    userId: number,
    targetDifficulty: number,
    tagIds: number[],
  ) {
    // 构建基本查询条件
    const where: any = {};

    // 不再严格限制难度，允许选择所有难度的题目
    // 在遗传算法的适应度计算中会优先选择接近目标难度的题目组合

    // 如果有标签要求，加入优先级较低的过滤条件
    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      };
    }

    return await this.prismaService.question.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createTime: 'desc',
      },
    });
  }

  // 遗传算法实现
  private runGeneticAlgorithm(
    questionPool: any[],
    typeTargets: Record<string, number>,
    targetDifficulty: number,
    tagIds: number[],
    totalCount: number,
  ) {
    const POPULATION_SIZE = 50; // 种群大小
    const MAX_GENERATIONS = 100; // 最大迭代次数
    const MUTATION_RATE = 0.1; // 变异率
    const CROSSOVER_RATE = 0.8; // 交叉率
    const ELITE_COUNT = 5; // 精英数量

    // 按题型对题目池进行分组
    const questionsByType = this.groupQuestionsByType(questionPool);

    // 创建初始种群
    let population = this.initializePopulation(
      POPULATION_SIZE,
      questionsByType,
      typeTargets,
      totalCount,
    );

    // 迭代进化
    for (let generation = 0; generation < MAX_GENERATIONS; generation++) {
      // 计算每个个体的适应度
      const fitnessValues = population.map((individual) =>
        this.calculateFitness(
          individual,
          typeTargets,
          targetDifficulty,
          tagIds,
        ),
      );

      // 检查是否有完美解决方案
      const bestFitnessIndex = fitnessValues.indexOf(
        Math.max(...fitnessValues),
      );
      const bestFitness = fitnessValues[bestFitnessIndex];

      // 如果找到完美解决方案或达到足够好的解决方案，提前结束
      if (bestFitness > 0.95 || generation === MAX_GENERATIONS - 1) {
        return population[bestFitnessIndex];
      }

      // 创建新一代种群
      const newPopulation = [];

      // 精英保留策略
      const eliteIndices = this.getEliteIndices(fitnessValues, ELITE_COUNT);
      eliteIndices.forEach((index) => {
        newPopulation.push([...population[index]]);
      });

      // 通过选择、交叉和变异生成新个体
      while (newPopulation.length < POPULATION_SIZE) {
        // 选择父代
        const parent1 = this.selectParent(population, fitnessValues);
        const parent2 = this.selectParent(population, fitnessValues);

        // 交叉
        let offspring;
        if (Math.random() < CROSSOVER_RATE) {
          offspring = this.crossover(parent1, parent2);
        } else {
          offspring = Math.random() < 0.5 ? [...parent1] : [...parent2];
        }

        // 变异
        if (Math.random() < MUTATION_RATE) {
          offspring = this.mutate(offspring, questionsByType, typeTargets);
        }

        newPopulation.push(offspring);
      }

      population = newPopulation;
    }

    // 返回最后一代中适应度最高的个体
    const finalFitnessValues = population.map((individual) =>
      this.calculateFitness(individual, typeTargets, targetDifficulty, tagIds),
    );
    const bestIndex = finalFitnessValues.indexOf(
      Math.max(...finalFitnessValues),
    );

    return population[bestIndex];
  }

  // 将题目按类型分组
  private groupQuestionsByType(questionPool: any[]) {
    const grouped = {
      radio: [],
      checkbox: [],
      input: [],
      judge: [],
      essay: [],
    };

    questionPool.forEach((question) => {
      if (grouped[question.type]) {
        grouped[question.type].push(question);
      }
    });

    return grouped;
  }

  // 初始化种群
  private initializePopulation(
    populationSize: number,
    questionsByType: Record<string, any[]>,
    typeTargets: Record<string, number>,
    totalCount: number,
  ) {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
      const individual = [];

      // 尝试满足每种题型的目标数量
      for (const [type, count] of Object.entries(typeTargets)) {
        const availableQuestions = questionsByType[type];

        if (availableQuestions.length > 0) {
          // 随机选择该类型的题目，数量不超过目标数量和可用数量
          const actualCount = Math.min(count, availableQuestions.length);

          // 随机选择不重复的题目
          const selectedIndices = this.getRandomIndices(
            availableQuestions.length,
            actualCount,
          );
          selectedIndices.forEach((index) => {
            individual.push(availableQuestions[index]);
          });
        }
      }

      // 如果个体题目数量不足，从其他类型随机补充
      if (individual.length < totalCount) {
        const allQuestions = Object.values(questionsByType).flat();
        const remainingCount = totalCount - individual.length;

        // 过滤掉已选择的题目
        const selectedIds = new Set(individual.map((q) => q.id));
        const availableQuestions = allQuestions.filter(
          (q) => !selectedIds.has(q.id),
        );

        if (availableQuestions.length >= remainingCount) {
          const additionalIndices = this.getRandomIndices(
            availableQuestions.length,
            remainingCount,
          );
          additionalIndices.forEach((index) => {
            individual.push(availableQuestions[index]);
          });
        }
      }

      population.push(individual);
    }

    return population;
  }

  // 获取随机不重复索引
  private getRandomIndices(max: number, count: number) {
    const indices = Array.from({ length: max }, (_, i) => i);

    // Fisher-Yates 洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return indices.slice(0, count);
  }

  // 计算适应度
  private calculateFitness(
    individual: any[],
    typeTargets: Record<string, number>,
    targetDifficulty: number,
    tagIds: number[],
  ) {
    if (individual.length === 0) return 0;

    // 题型匹配度评分 (40%)
    const typeScore = this.calculateTypeMatchScore(individual, typeTargets);

    // 难度匹配度评分 (30%)
    const difficultyScore = this.calculateDifficultyMatchScore(
      individual,
      targetDifficulty,
    );

    // 标签匹配度评分 (30%)
    const tagScore = this.calculateTagMatchScore(individual, tagIds);

    // 综合适应度分数 - 加权平均
    return typeScore * 0.4 + difficultyScore * 0.3 + tagScore * 0.3;
  }

  // 计算题型匹配度
  private calculateTypeMatchScore(
    individual: any[],
    typeTargets: Record<string, number>,
  ) {
    // 统计个体中各类型题目的数量
    const typeCounts = {
      radio: 0,
      checkbox: 0,
      input: 0,
      judge: 0,
      essay: 0,
    };

    individual.forEach((question) => {
      if (typeCounts[question.type] !== undefined) {
        typeCounts[question.type]++;
      }
    });

    // 计算每种类型的匹配度
    let totalDiff = 0;
    let totalTarget = 0;

    for (const [type, target] of Object.entries(typeTargets)) {
      if (target > 0) {
        const diff = Math.abs(typeCounts[type] - target);
        totalDiff += diff;
        totalTarget += target;
      }
    }

    // 将差异转换为0-1分数，差异越小分数越高
    return totalTarget > 0 ? Math.max(0, 1 - totalDiff / totalTarget) : 1;
  }

  // 计算难度匹配度
  private calculateDifficultyMatchScore(
    individual: any[],
    targetDifficulty: number,
  ) {
    if (!targetDifficulty) return 1; // 如果没有指定难度，给满分

    if (individual.length === 0) return 0;

    // 计算试卷中所有题目的平均难度与目标难度的接近程度
    let totalDifficulty = 0;
    individual.forEach((q) => {
      totalDifficulty += Number(q.difficulty); // 确保转换为数字
    });

    const avgDifficulty = totalDifficulty / individual.length;

    // 难度范围在0-5之间，计算与目标难度的接近程度(归一化到0-1)
    // 差异越小，分数越高
    const diffScore = 1 - Math.abs(avgDifficulty - targetDifficulty) / 5;

    return Math.max(0, diffScore); // 确保分数不小于0
  }

  // 计算标签匹配度
  private calculateTagMatchScore(individual: any[], tagIds: number[]) {
    if (!tagIds || tagIds.length === 0) return 1; // 如果没有指定标签，给满分

    // 计算每道题的标签匹配率，然后平均
    let totalScore = 0;

    individual.forEach((question) => {
      // 获取题目的标签ID列表
      const questionTagIds = question.tags.map((t) => t.tag.id);

      // 计算交集大小
      const intersection = tagIds.filter((id) => questionTagIds.includes(id));

      // 计算匹配率 (Jaccard系数的变体)
      const matchRate = intersection.length / tagIds.length;

      totalScore += matchRate;
    });

    return individual.length > 0 ? totalScore / individual.length : 0;
  }

  // 选择父代 (锦标赛选择法)
  private selectParent(population: any[][], fitnessValues: number[]) {
    // 随机选择参与锦标赛的个体索引
    const tournamentSize = 3;
    const tournamentIndices = this.getRandomIndices(
      population.length,
      tournamentSize,
    );

    // 选择锦标赛中适应度最高的个体
    let bestIndex = tournamentIndices[0];
    let bestFitness = fitnessValues[bestIndex];

    for (let i = 1; i < tournamentSize; i++) {
      const index = tournamentIndices[i];
      if (fitnessValues[index] > bestFitness) {
        bestIndex = index;
        bestFitness = fitnessValues[index];
      }
    }

    return population[bestIndex];
  }

  // 获取精英索引
  private getEliteIndices(fitnessValues: number[], eliteCount: number) {
    // 创建带索引的适应度值数组
    const indexedFitness = fitnessValues.map((value, index) => ({
      value,
      index,
    }));

    // 按适应度降序排序
    indexedFitness.sort((a, b) => b.value - a.value);

    // 返回前N个索引
    return indexedFitness.slice(0, eliteCount).map((item) => item.index);
  }

  // 交叉操作
  private crossover(parent1: any[], parent2: any[]) {
    // 确保父代有效
    if (parent1.length === 0 || parent2.length === 0) {
      return parent1.length > 0 ? [...parent1] : [...parent2];
    }

    // 单点交叉
    const crossoverPoint = Math.floor(
      Math.random() * Math.min(parent1.length, parent2.length),
    );

    // 组合父代创建子代
    const offspring = [
      ...parent1.slice(0, crossoverPoint),
      ...parent2.slice(crossoverPoint),
    ];

    // 过滤掉重复的题目
    const uniqueQuestions = [];
    const seenIds = new Set();

    for (const question of offspring) {
      if (!seenIds.has(question.id)) {
        uniqueQuestions.push(question);
        seenIds.add(question.id);
      }
    }

    return uniqueQuestions;
  }

  // 变异操作
  private mutate(
    individual: any[],
    questionsByType: Record<string, any[]>,
    typeTargets: Record<string, number>,
  ) {
    // 确保个体有效
    if (individual.length === 0) return individual;

    // 随机选择一个题目进行替换
    const mutationIndex = Math.floor(Math.random() * individual.length);
    const questionToReplace = individual[mutationIndex];

    // 如果该类型需要更多题目，优先选择同类型替换
    const preferredType =
      Object.entries(typeTargets).find(
        ([type, count]) =>
          count > individual.filter((q) => q.type === type).length,
      )?.[0] || questionToReplace.type;

    // 从题目池中选择替代题目
    const replacementPool =
      questionsByType[preferredType] || questionsByType[questionToReplace.type];

    // 过滤已经在个体中的题目
    const availableReplacements =
      replacementPool?.filter(
        (q) => !individual.some((iq) => iq.id === q.id),
      ) || [];

    // 如果有可用的替代题目，进行替换
    if (availableReplacements.length > 0) {
      const replacementIndex = Math.floor(
        Math.random() * availableReplacements.length,
      );

      // 创建新的个体副本
      const mutatedIndividual = [...individual];
      mutatedIndividual[mutationIndex] =
        availableReplacements[replacementIndex];

      return mutatedIndividual;
    }

    return individual; // 没有可用的替代题目，返回原始个体
  }

  // 安全解析JSON的辅助方法
  private safeParseJSON(jsonString: string) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      // 如果解析失败，直接返回原字符串
      console.log('JSON解析失败:', e.message);
      return jsonString;
    }
  }
}
