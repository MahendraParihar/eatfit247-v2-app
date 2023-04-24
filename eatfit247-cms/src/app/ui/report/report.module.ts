import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ReportRoutingModule} from './report-routing.module';
import {ContactUsReportComponent} from "./contact-us-report/contact-us-report.component";
import {MaterialModule} from "../../material.module";
import {FlexLayoutModule} from "@angular/flex-layout";
import {ShareModule} from "../shared/share.module";
import {PreviewContactUsDialogComponent} from './preview-contact-us-dialog/preview-contact-us-dialog.component';


@NgModule({
  declarations: [
    ContactUsReportComponent,
    PreviewContactUsDialogComponent
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    CommonModule,
    ReportRoutingModule
  ],
  entryComponents: [PreviewContactUsDialogComponent]
})
export class ReportModule {
}
