import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PressMediaRoutingModule } from './press-media-routing.module';
import { PressMediaListComponent } from './press-media-list/press-media-list.component';
import { PressMediaManageComponent } from './press-media-manage/press-media-manage.component';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ShareModule } from '../shared/share.module';

@NgModule({
  declarations: [
    PressMediaListComponent,
    PressMediaManageComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    PressMediaRoutingModule,
  ]
})
export class PressMediaModule {
}

