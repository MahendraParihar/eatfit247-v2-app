import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { ReferrerListComponent } from './referrer-list/referrer-list.component';
import { ReferrerManageComponent } from './referrer-manage/referrer-manage.component';
import { ReferrerDetailComponent } from './referrer-detail/referrer-detail.component';

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: ReferrerListComponent,
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: ReferrerManageComponent,
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: ReferrerManageComponent,
  },
  {
    path: 'detail/:id',
    canActivate: [AuthGuard],
    component: ReferrerDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReferrerRoutingModule {
}
