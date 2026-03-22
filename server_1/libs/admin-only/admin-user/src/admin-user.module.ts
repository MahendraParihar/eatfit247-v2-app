import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  MstAdminRole,
  MstAdminRolePermission,
  MstAdminUser,
  TxnAdminFranchise,
} from '@server_1/core';
import { AdminUserController } from './controllers';
import { AdminUserService } from './services';

// Models are registered in CommonModule

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstAdminUser,
      MstAdminRolePermission,
      MstAdminRole,
      TxnAdminFranchise,
    ]),
  ],
  controllers: [
    AdminUserController,
  ],
  providers: [
    AdminUserService,
  ],
  exports: [
    AdminUserService,
    SequelizeModule,
  ],
})
export class AdminUserModule {
}
