import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstProgram, MstProgramPlan, MstProgramPlanFees, MstProgramPlanType } from './models';
import {
  ProgramController,
  ProgramPlanController,
  PublicProgramController,
  PublicProgramPlanController,
} from './controllers';
import { ProgramPlanService, ProgramService } from './services';
// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([
  MstProgram,
  MstProgramPlanType,
  MstProgramPlan,
  MstProgramPlanFees,
]);

@Module({
  imports: [
    SequelizeModule.forFeature([MstProgram, MstProgramPlanType, MstProgramPlan, MstProgramPlanFees]),
  ],
  controllers: [
    // Register admin controllers (with static sub-paths like 'program-master') before
    // public controllers whose ':id' route would otherwise swallow those static paths.
    ProgramController,
    ProgramPlanController,
    PublicProgramController,
    PublicProgramPlanController,
  ],
  providers: [
    ProgramService,
    ProgramPlanService,
  ],
  exports: [
    ProgramService,
    ProgramPlanService,
    SequelizeModule,
  ],
})
export class ProgramPlanModule {
}
