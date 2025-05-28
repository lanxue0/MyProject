import { NestFactory } from '@nestjs/core';
import { ClassroomModule } from './classroom.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ClassroomModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors();

  await app.listen(3009);
  console.log('Classroom service running on http://localhost:3009');
}
bootstrap();
