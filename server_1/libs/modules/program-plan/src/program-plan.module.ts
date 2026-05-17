import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstProgram, MstProgramPlan, MstProgramPlanFees, MstProgramPlanType } from './models';
import { ProgramPlanService, ProgramService } from './services';

modelRegistry.register([
  MstProgram,
  MstProgramPlanType,
  MstProgramPlan,
  MstProgramPlanFees,
]);

/**
 * Services-only module. Imported by other modules (e.g. MemberModule) that
 * need ProgramService/ProgramPlanService without dragging admin or public
 * controllers into the importing app.
 *
 * Apps should import ProgramPlanAdminModule or ProgramPlanPublicModule
 * instead of this module.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([MstProgram, MstProgramPlanType, MstProgramPlan, MstProgramPlanFees]),
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
