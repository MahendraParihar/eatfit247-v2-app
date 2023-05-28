import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { BlogListComponent } from './blog-list/blog-list.component';
import { BlogManageComponent } from './blog-manage/blog-manage.component';

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: BlogListComponent,
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: BlogManageComponent,
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: BlogManageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BlogsRoutingModule {
}
