import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from '../libs/common/src/common.module';

@Module({
  imports: [
    CommonModule.forRoot([]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

