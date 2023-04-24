import { Module } from '@nestjs/common';
import { MemberTestimonialController } from './controllers/member-testimonial/member-testimonial.controller';

@Module({
  controllers: [MemberTestimonialController],
})
export class MemberTestimonialModule {}
