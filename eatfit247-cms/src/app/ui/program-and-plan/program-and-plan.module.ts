import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ProgramAndPlanRoutingModule} from './program-and-plan-routing.module';
import {ProgramListComponent} from './program-list/program-list.component';
import {ProgramManageComponent} from './program-manage/program-manage.component';
import {PlanListComponent} from './plan-list/plan-list.component';
import {PlanManageComponent} from './plan-manage/plan-manage.component';
import {ProgramFaqListComponent} from './program-faq-list/program-faq-list.component';
import {ProgramFaqManageComponent} from './program-faq-manage/program-faq-manage.component';
import {MaterialModule} from "../../material.module";
import {FlexLayoutModule} from "@angular/flex-layout";
import {ShareModule} from "../shared/share.module";


@NgModule({
  declarations: [
    ProgramListComponent,
    ProgramManageComponent,
    PlanListComponent,
    PlanManageComponent,
    ProgramFaqListComponent,
    ProgramFaqManageComponent
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    CommonModule,
    ProgramAndPlanRoutingModule
  ]
})
export class ProgramAndPlanModule {
}
