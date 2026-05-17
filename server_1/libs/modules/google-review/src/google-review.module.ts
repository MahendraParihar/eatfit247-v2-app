import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TxnGoogleReview } from './models';
import { GoogleReviewService } from './services';
import { GoogleReviewController, PublicGoogleReviewController } from './controllers';

modelRegistry.register([TxnGoogleReview]);

@Module({
  imports: [SequelizeModule.forFeature([TxnGoogleReview])],
  controllers: [
    PublicGoogleReviewController,
    GoogleReviewController,
  ],
  providers: [GoogleReviewService],
  exports: [GoogleReviewService, SequelizeModule],
})
export class GoogleReviewModule {}
