import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PocketGuideListComponent } from './pocket-guide-list/pocket-guide-list.component';
import { PocketGuideManageComponent } from './pocket-guide-manage/pocket-guide-manage.component';
import { PocketGuideRoutingModule } from './pocket-guide-routing.module';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ShareModule } from '../shared/share.module';

@NgModule({
  declarations: [
    PocketGuideListComponent,
    PocketGuideManageComponent,
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    CommonModule,
    PocketGuideRoutingModule,
  ],
})
export class PocketGuideModule {
}
