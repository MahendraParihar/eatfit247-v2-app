import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, MstAdminRole, modelRegistry } from '@server/common';
import { MstAdminRolePermission } from './models/mst-admin-role-permission.model';
import {
  AdminUserController,
} from './controllers';
import {
  AdminUserService,
} from './services';

// Register models with the model registry
modelRegistry.register([MstAdminRolePermission]);

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
