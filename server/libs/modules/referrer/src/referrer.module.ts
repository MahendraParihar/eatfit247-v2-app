import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstReferrer } from './models';
import { modelRegistry } from '@server/common';
import { ReferrerController, PublicReferrerController } from './controllers';
import { ReferrerService } from './services';

// Register models with the model registry
modelRegistry.register([MstReferrer]);

@Module({
  imports: [
    SequelizeModule.forFeature([MstReferrer]),
  ],
  controllers: [
    ReferrerController,
    PublicReferrerController,
  ],
  providers: [
    ReferrerService,
  ],
  exports: [
    ReferrerService,
    SequelizeModule,
  ],
})
export class ReferrerModule {
}
