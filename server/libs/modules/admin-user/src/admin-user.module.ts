import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, MstAdminRole, MstAdminRolePermission } from '@server/common';
import {
  AdminUserController,
} from './controllers';
import {
  AdminUserService,
} from './services';

// Models are registered in @server/common module

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstAdminUser,
      MstAdminRolePermission,
      MstAdminRole,
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
