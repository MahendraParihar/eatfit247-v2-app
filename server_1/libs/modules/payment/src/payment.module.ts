import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnMemberPayment } from '@server_1/modules/member';
import { RazorpayService } from '@server_1/platform';
import { PaymentService } from './services';
import { RazorpayWebhookController } from './controllers/public';

@Module({
  imports: [
    SequelizeModule.forFeature([TxnMemberPayment]),
  ],
  controllers: [RazorpayWebhookController],
  providers: [PaymentService, RazorpayService],
  exports: [
    SequelizeModule,
    PaymentService,
  ],
})
export class PaymentModule {
}
