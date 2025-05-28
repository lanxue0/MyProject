import { NestFactory } from '@nestjs/core';
import { TagModule } from './tag.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(TagModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3008);
  console.log('Tag service running on port 3008');
}

bootstrap();
