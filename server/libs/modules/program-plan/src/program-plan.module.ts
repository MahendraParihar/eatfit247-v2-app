import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan } from './models';
import { modelRegistry } from '@server/common';
import { ProgramCategoryController, PublicProgramCategoryController, ProgramController, PublicProgramController, ProgramPlanController, PublicProgramPlanController } from './controllers';
import { ProgramCategoryService, ProgramService, ProgramPlanService } from './services';

// Register models with the model registry
modelRegistry.register([MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan]);

@Module({
  imports: [
    SequelizeModule.forFeature([MstProgramCategory, MstProgram, MstProgramPlanType, MstProgramPlan]),
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
