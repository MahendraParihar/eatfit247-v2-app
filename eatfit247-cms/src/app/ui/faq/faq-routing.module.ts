import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { FaqListComponent } from './faq-list/faq-list.component';
import { FaqManageComponent } from './faq-manage/faq-manage.component';

const routes: Routes = [
  {
    path: 'faq-list',
    canActivate: [AuthGuard],
    component: FaqListComponent,
  },
  {
    path: 'faq-manage',
    canActivate: [AuthGuard],
    component: FaqManageComponent,
  },
  {
    path: 'faq-manage/:id',
    canActivate: [AuthGuard],
    component: FaqManageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FaqRoutingModule {
}
