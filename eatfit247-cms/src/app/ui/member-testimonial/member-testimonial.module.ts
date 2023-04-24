import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {MemberTestimonialRoutingModule} from './member-testimonial-routing.module';
import {MemberTestimonialListComponent} from './member-testimonial-list/member-testimonial-list.component';
import {MemberTestimonialManageComponent} from './member-testimonial-manage/member-testimonial-manage.component';


@NgModule({
  declarations: [
    MemberTestimonialListComponent,
    MemberTestimonialManageComponent
  ],
  imports: [
    CommonModule,
    MemberTestimonialRoutingModule
  ]
})
export class MemberTestimonialModule {
}
