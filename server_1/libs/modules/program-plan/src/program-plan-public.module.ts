import { Module } from '@nestjs/common';
import { PublicProgramController, PublicProgramPlanController } from './controllers';
import { ProgramPlanModule } from './program-plan.module';

/**
 * Public-only Program/ProgramPlan Module
 * Only includes the public controllers; services come from ProgramPlanModule.
 */
@Module({
  imports: [ProgramPlanModule],
  controllers: [
    PublicProgramController,
    PublicProgramPlanController,
  ],
  exports: [ProgramPlanModule],
})
export class ProgramPlanPublicModule {
}
