import { Module } from '@nestjs/common';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';
import { PrismaModule } from '@app/prisma';
import { CommonModule } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@app/common';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ClientsModule.register([
      {
        name: 'CLASSROOM_SERVICE',
        transport: Transport.TCP,
        options: {
          port: 8888,
        },
      },
    ]),
  ],
  controllers: [ClassroomController],
  providers: [
    ClassroomService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class ClassroomModule {}
