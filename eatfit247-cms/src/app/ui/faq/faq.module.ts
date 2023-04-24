import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FaqRoutingModule} from './faq-routing.module';
import {FaqListComponent} from './faq-list/faq-list.component';
import {FaqManageComponent} from './faq-manage/faq-manage.component';
import {MaterialModule} from "../../material.module";
import {FlexLayoutModule} from "@angular/flex-layout";
import {ShareModule} from "../shared/share.module";


@NgModule({
  declarations: [
    FaqListComponent,
    FaqManageComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    FaqRoutingModule
  ]
})
export class FaqModule {
}
