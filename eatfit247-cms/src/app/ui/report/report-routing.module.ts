import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "../../guard/auth-guard";
import {ContactUsReportComponent} from "./contact-us-report/contact-us-report.component";

const routes: Routes = [
  {
    path: 'contact-us-report',
    canActivate: [AuthGuard],
    component: ContactUsReportComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule {
}
