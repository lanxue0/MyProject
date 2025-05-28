import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { PrismaModule } from '@app/prisma';
import { RedisModule } from '@app/redis';
import { AuthGuard, CommonModule } from '@app/common';
import { APP_GUARD } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    CommonModule,
    ClientsModule.register([
      {
        name: 'QUESTION_SERVICE',
        transport: Transport.TCP,
        options: {
          port: 8888,
        },
      },
    ]),
  ],
  controllers: [QuestionController],
  providers: [
    QuestionService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class QuestionModule {}
