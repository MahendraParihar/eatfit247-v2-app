import { Module } from '@nestjs/common';
import { CommonModule } from '@server/common';
import { PaymentModule } from '@server/modules/payment';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // CommonModule initializes database connection with only common models
    // Each lib module registers its own models via SequelizeModule.forFeature()
    CommonModule.forRoot(),
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

