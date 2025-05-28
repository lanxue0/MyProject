import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { ClientsModule } from '@nestjs/microservices';
import { ExcelModule } from '@app/excel';
import { Transport } from '@nestjs/microservices';
import { AuthGuard, CommonModule } from '@app/common';
import { PrismaModule } from '@app/prisma';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PrismaModule,
    ExcelModule,
    CommonModule,
    ClientsModule.register([
      {
        name: 'TAG_SERVICE',
        transport: Transport.TCP,
        options: {
          port: 8888,
        },
      },
    ]),
  ],
  controllers: [TagController],
  providers: [
    TagService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class TagModule {}
