import { NestFactory } from '@nestjs/core';
import { QuestionModule } from './question.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(QuestionModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3006);
}
bootstrap();
