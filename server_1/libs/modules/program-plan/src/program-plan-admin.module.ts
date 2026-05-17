import { Module } from '@nestjs/common';
import { ProgramController, ProgramPlanController } from './controllers';
import { ProgramPlanModule } from './program-plan.module';

/**
 * Admin-only Program/ProgramPlan Module
 * Only includes the admin controllers; services come from ProgramPlanModule.
 */
@Module({
  imports: [ProgramPlanModule],
  controllers: [
    ProgramController,
    ProgramPlanController,
  ],
  exports: [ProgramPlanModule],
})
export class ProgramPlanAdminModule {
}
