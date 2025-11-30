import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, MstAdminRole } from '@server/common';
import { MstAdminRolePermission } from './models/mst-admin-role-permission.model';
import { MstFranchise } from '../../../common/src/models/mst-franchise.model';
import {
  AdminUserController,
} from './controllers';
import {
  AdminUserService,
} from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstAdminUser,
      MstAdminRolePermission,
      MstAdminRole,
      MstFranchise,
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
