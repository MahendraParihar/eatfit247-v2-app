import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "../../guard/auth-guard";
import {DietTemplateDetailsComponent} from './diet-template-details/diet-template-details.component';
import {DietTemplateListComponent} from "./diet-template-list/diet-template-list.component";
import {DietTemplateManageComponent} from "./diet-template-manage/diet-template-manage.component";

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: DietTemplateListComponent
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: DietTemplateManageComponent
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: DietTemplateManageComponent
  },
  {
    path: 'detail/:id',
    canActivate: [AuthGuard],
    component: DietTemplateDetailsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DietTemplateRoutingModule {
}
