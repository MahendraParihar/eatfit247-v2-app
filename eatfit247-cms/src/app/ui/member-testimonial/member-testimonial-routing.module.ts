import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "../../guard/auth-guard";
import {MemberTestimonialListComponent} from "./member-testimonial-list/member-testimonial-list.component";
import {MemberTestimonialManageComponent} from "./member-testimonial-manage/member-testimonial-manage.component";

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: MemberTestimonialListComponent
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: MemberTestimonialManageComponent
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: MemberTestimonialManageComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberTestimonialRoutingModule {
}
