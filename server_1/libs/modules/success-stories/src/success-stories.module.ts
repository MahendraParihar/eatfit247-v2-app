import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnSuccessStories } from './models';
import { modelRegistry } from '@server_1/core';
import { SuccessStoryController, PublicSuccessStoryController } from './controllers';
import { SuccessStoryService } from './services';
// Register models with the model registry
modelRegistry.register([TxnSuccessStories]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnSuccessStories]),
  ],
  controllers: [
    PublicSuccessStoryController, // Register public controller first to avoid route conflicts
    SuccessStoryController,
  ],
  providers: [
    SuccessStoryService,
  ],
  exports: [
    SuccessStoryService,
    SequelizeModule,
  ],
})
export class SuccessStoriesModule {
}

