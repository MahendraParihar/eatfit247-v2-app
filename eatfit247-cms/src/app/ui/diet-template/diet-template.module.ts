import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DietTemplateRoutingModule } from './diet-template-routing.module';
import { DietTemplateListComponent } from './diet-template-list/diet-template-list.component';
import { DietTemplateManageComponent } from './diet-template-manage/diet-template-manage.component';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ShareModule } from '../shared/share.module';
import { DietTemplateManageDialogComponent } from './diet-template-manage-dialog/diet-template-manage-dialog.component';
import { DietTemplateDetailsComponent } from './diet-template-details/diet-template-details.component';

@NgModule({
  declarations: [
    DietTemplateListComponent,
    DietTemplateManageComponent,
    DietTemplateManageDialogComponent,
    DietTemplateDetailsComponent,
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    CommonModule,
    DietTemplateRoutingModule,
  ],
  entryComponents: [
    DietTemplateManageDialogComponent,
  ],
})
export class DietTemplateModule {
}
