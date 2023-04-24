import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FranchiseRoutingModule} from './franchise-routing.module';
import {FranchiseListComponent} from './franchise-list/franchise-list.component';
import {FranchiseManageComponent} from './franchise-manage/franchise-manage.component';
import {MaterialModule} from "../../material.module";
import {FlexLayoutModule} from "@angular/flex-layout";
import {ShareModule} from "../shared/share.module";
import {FranchiseDetailComponent} from './franchise-detail/franchise-detail.component';


@NgModule({
  declarations: [
    FranchiseListComponent,
    FranchiseManageComponent,
    FranchiseDetailComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    FranchiseRoutingModule
  ]
})
export class FranchiseModule {
}
