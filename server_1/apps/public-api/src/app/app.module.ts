import { Module } from '@nestjs/common';
import { CommonModule } from '@server_1/core';
import { PlatformModule } from '@server_1/platform';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Import modules first so their modelRegistry.register() calls execute before CommonModule.forRoot()
// Only import modules that have public controllers
import { BlogsModule } from '@server_1/modules/blogs';
import { BannerModule } from '@server_1/modules/banner';
import { LegalPagesModule } from '@server_1/modules/pages';

@Module({
  imports: [
    PlatformModule.forRoot(),
    // Import feature modules before CommonModule so modelRegistry.register() executes
    BlogsModule,
    BannerModule,
    LegalPagesModule,
    CommonModule.forRoot([], PlatformModule.getModels()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}

