import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstCallLogStatus, MstCallPurpose, MstCallType } from './models';
import {
  CallLogStatusController,
  CallPurposeController,
  CallTypeController,
  PublicCallLogStatusController,
  PublicCallPurposeController,
  PublicCallTypeController,
} from './controllers';
import { CallLogStatusService, CallPurposeService, CallTypeService } from './services';
// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([MstCallLogStatus, MstCallPurpose, MstCallType]);

@Module({
  imports: [
    SequelizeModule.forFeature([MstCallLogStatus, MstCallPurpose, MstCallType]),
  ],
  controllers: [
    CallLogStatusController,
    CallPurposeController,
    CallTypeController,
    PublicCallLogStatusController,
    PublicCallPurposeController,
    PublicCallTypeController,
  ],
  providers: [
    CallLogStatusService,
    CallPurposeService,
    CallTypeService,
  ],
  exports: [
    CallLogStatusService,
    CallPurposeService,
    CallTypeService,
    SequelizeModule,
  ],
})
export class CallLogsModule {
}

