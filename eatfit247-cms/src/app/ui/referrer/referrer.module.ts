import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferrerRoutingModule } from './referrer-routing.module';
import { ReferrerListComponent } from './referrer-list/referrer-list.component';
import { ReferrerManageComponent } from './referrer-manage/referrer-manage.component';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ShareModule } from '../shared/share.module';
import { ReferrerDetailComponent } from './referrer-detail/referrer-detail.component';

@NgModule({
  declarations: [
    ReferrerListComponent,
    ReferrerManageComponent,
    ReferrerDetailComponent,
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    CommonModule,
    ReferrerRoutingModule,
  ],
})
export class ReferrerModule {
}
