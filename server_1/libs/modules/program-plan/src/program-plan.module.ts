import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstProgram, MstProgramCategory, MstProgramPlan, MstProgramPlanFees, MstProgramPlanType } from './models';
import {
  ProgramCategoryController,
  ProgramController,
  ProgramPlanController,
  PublicProgramCategoryController,
  PublicProgramController,
  PublicProgramPlanController,
} from './controllers';
import { ProgramCategoryService, ProgramPlanService, ProgramService } from './services';
// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([
  MstProgramCategory,
  MstProgram,
  MstProgramPlanType,
  MstProgramPlan,
  MstProgramPlanFees,
]);

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
