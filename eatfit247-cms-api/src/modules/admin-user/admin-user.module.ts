import { Module } from '@nestjs/common';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { CommonService } from '../common/common.service';
import { FranchiseService } from '../franchise/franchise.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [AdminUserController],
  providers: [ExceptionService, AdminUserService, CommonService, FranchiseService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
