import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AdminModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3007);
  console.log('Admin service running on port 3007');
}

bootstrap();
