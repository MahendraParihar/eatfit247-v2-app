import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './controllers/common.controller';
import { ExceptionService } from './exception.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ConfigParametersController } from './controllers/config-parameters.controller';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [CommonController, ConfigParametersController],
  providers: [CommonService, ExceptionService],
  exports: [CommonService, ExceptionService],
})
export class CommonModule {}
