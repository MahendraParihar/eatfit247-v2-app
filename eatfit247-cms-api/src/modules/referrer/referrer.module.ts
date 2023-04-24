import { Module } from '@nestjs/common';
import { ReferrerController } from './controllers/referrer.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { ReferrerService } from './referrer.service';
import { CommonService } from '../common/common.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [ReferrerController],
  providers: [ExceptionService, ReferrerService, CommonService],
  exports: [ReferrerService],
})
export class ReferrerModule {}
