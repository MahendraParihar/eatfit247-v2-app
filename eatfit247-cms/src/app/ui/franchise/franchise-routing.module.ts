import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { FranchiseListComponent } from './franchise-list/franchise-list.component';
import { FranchiseManageComponent } from './franchise-manage/franchise-manage.component';
import { FranchiseDetailComponent } from './franchise-detail/franchise-detail.component';

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: FranchiseListComponent,
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: FranchiseManageComponent,
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: FranchiseManageComponent,
  },
  {
    path: 'detail/:id',
    canActivate: [AuthGuard],
    component: FranchiseDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FranchiseRoutingModule {
}
