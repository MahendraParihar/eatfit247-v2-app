import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { RecipeMigrationController } from './recipe-migration.controller';
import { MemberMigrationController } from './member-migration.controller';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import { CurrencyService } from '../lov/services/currency.service';
import { CommonService } from '../common/common.service';
import { ExceptionService } from '../common/exception.service';
import { BlogMigrationController } from './blog-migration.controller';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [RecipeMigrationController, MemberMigrationController, BlogMigrationController],
  providers: [ConfigParameterService, CurrencyService, CommonService, ExceptionService],
})
export class DataMigrationModule {}
