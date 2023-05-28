import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { PocketGuideManageComponent } from './pocket-guide-manage/pocket-guide-manage.component';
import { PocketGuideListComponent } from './pocket-guide-list/pocket-guide-list.component';

const routes: Routes = [
  {
    path: 'pocket-guide-list',
    canActivate: [AuthGuard],
    component: PocketGuideListComponent,
  },
  {
    path: 'pocket-guide-manage',
    canActivate: [AuthGuard],
    component: PocketGuideManageComponent,
  },
  {
    path: 'pocket-guide-manage/:id',
    canActivate: [AuthGuard],
    component: PocketGuideManageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PocketGuideRoutingModule {
}
