import { Module } from '@nestjs/common';
import { ProgramController } from './controllers/program.controller';
import { PlanController } from './controllers/plan.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { BlogService } from '../blog/blog.service';
import { CommonService } from '../common/common.service';
import { ProgramCategoryService } from '../lov/services/program-category.service';
import { ProgramService } from './services/program.service';
import { PlanService } from './services/plan.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  providers: [ExceptionService, BlogService, CommonService, ProgramCategoryService, ProgramService, PlanService],
  controllers: [ProgramController, PlanController],
  exports: [ProgramService, PlanService],
})
export class ProgramAndPlanModule {}
