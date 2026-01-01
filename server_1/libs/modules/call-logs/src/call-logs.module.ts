import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstCallLogStatus, MstCallPurpose, MstCallType } from './models';
import {
  CallLogStatusController,
  CallPurposeController,
  CallTypeController,
  PublicCallLogStatusController,
  PublicCallPurposeController,
  PublicCallTypeController,
} from './controllers';
import {
  CallLogStatusService,
  CallPurposeService,
  CallTypeService,
} from './services';

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

