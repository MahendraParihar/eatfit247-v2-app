import { Module } from '@nestjs/common';
import { PocketGuideController } from './controllers/pocket-guide.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { PocketGuideService } from './pocket-guide.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [PocketGuideController],
  providers: [ExceptionService, PocketGuideService],
  exports: [ExceptionService],
})
export class PocketGuideModule {}
