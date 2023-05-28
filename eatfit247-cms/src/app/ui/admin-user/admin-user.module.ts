import { NgModule } from '@angular/core';
import { AdminUserRoutingModule } from './admin-user-routing.module';
import { AdminUserListComponent } from './admin-user-list/admin-user-list.component';
import { AdminUserManageComponent } from './admin-user-manage/admin-user-manage.component';
import { AdminUserChangePasswordComponent } from './admin-user-change-password/admin-user-change-password.component';
import { AdminUserEditProfileComponent } from './admin-user-edit-profile/admin-user-edit-profile.component';
import { MaterialModule } from '../../material.module';
import { AdminUserSettingComponent } from './admin-user-setting/admin-user-setting.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonModule } from '@angular/common';
import { ShareModule } from '../shared/share.module';

@NgModule({
  declarations: [
    AdminUserListComponent,
    AdminUserManageComponent,
    AdminUserChangePasswordComponent,
    AdminUserEditProfileComponent,
    AdminUserSettingComponent,
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    CommonModule,
    ShareModule,
    AdminUserRoutingModule,
  ],
})
export class AdminUserModule {
}
