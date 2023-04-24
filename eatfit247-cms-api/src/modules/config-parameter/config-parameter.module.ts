import { Module } from '@nestjs/common';
import { ConfigParameterController } from './config-parameter.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { ConfigParameterService } from './config-parameter.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [ConfigParameterController],
  providers: [ExceptionService, ConfigParameterService],
  exports: [ExceptionService, ConfigParameterService],
})
export class ConfigParameterModule {}
