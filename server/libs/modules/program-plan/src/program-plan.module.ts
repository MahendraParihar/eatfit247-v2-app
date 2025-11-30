import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan } from './models';
import { ProgramCategoryController, PublicProgramCategoryController, ProgramController, PublicProgramController, ProgramPlanController, PublicProgramPlanController } from './controllers';
import { ProgramCategoryService, ProgramService, ProgramPlanService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan, MstAdminUser]),
  ],
  controllers: [
    ProgramCategoryController,
    PublicProgramCategoryController,
    ProgramController,
    PublicProgramController,
    ProgramPlanController,
    PublicProgramPlanController,
  ],
  providers: [
    ProgramCategoryService,
    ProgramService,
    ProgramPlanService,
  ],
  exports: [
    ProgramCategoryService,
    ProgramService,
    ProgramPlanService,
    SequelizeModule,
  ],
})
export class ProgramPlanModule {
}
