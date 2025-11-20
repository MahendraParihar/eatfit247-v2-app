import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { PressMediaListComponent } from './press-media-list/press-media-list.component';
import { PressMediaManageComponent } from './press-media-manage/press-media-manage.component';

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: PressMediaListComponent,
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: PressMediaManageComponent,
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: PressMediaManageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PressMediaRoutingModule {
}

