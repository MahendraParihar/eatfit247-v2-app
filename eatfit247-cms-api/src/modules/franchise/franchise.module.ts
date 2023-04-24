import { Module } from '@nestjs/common';
import { FranchiseController } from './contollers/franchise.controller';
import { FranchiseService } from './franchise.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { CommonService } from '../common/common.service';
import { AdminUserService } from '../admin-user/admin-user.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [FranchiseController],
  providers: [ExceptionService, FranchiseService, CommonService, AdminUserService],
  exports: [FranchiseService],
})
export class FranchiseModule {}
