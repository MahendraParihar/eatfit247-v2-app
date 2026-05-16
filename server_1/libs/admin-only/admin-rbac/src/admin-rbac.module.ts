import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  MstAdminAction,
  MstAdminRole,
  MstAdminRoleSubjectPermission,
  MstAdminSubject,
  TxnAdminUserRole,
} from '@server_1/core';
import { AdminRbacController } from './controllers';
import { AdminRbacService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstAdminRole,
      MstAdminSubject,
      MstAdminAction,
      MstAdminRoleSubjectPermission,
      TxnAdminUserRole,
    ]),
  ],
  controllers: [AdminRbacController],
  providers: [AdminRbacService],
  exports: [AdminRbacService, SequelizeModule],
})
export class AdminRbacModule {}
