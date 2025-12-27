import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan, MstProgramPlanFees } from '@server/common';
import { ProgramCategoryController, PublicProgramCategoryController, ProgramController, PublicProgramController, ProgramPlanController, PublicProgramPlanController } from './controllers';
import { ProgramCategoryService, ProgramService, ProgramPlanService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan, MstProgramPlanFees]),
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
