import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentStatusController } from './controllers/admin';

@Module({
  imports: [
    SequelizeModule.forFeature([]),
  ],
  controllers: [PaymentStatusController],
  providers: [],
  exports: [
    SequelizeModule,
  ],
})
export class LovsModule {
}
