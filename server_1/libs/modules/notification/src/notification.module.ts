import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { NotificationLogModel } from './models';
import { NotificationController } from './controllers/admin/notification.controller';
import { EmailTemplateController } from './controllers/admin/email-template.controller';
import { WhatsAppWebhookController } from './webhooks/whatsapp-webhook.controller';
import {
  NotificationService,
  LogService,
  TemplateService,
  EmailProvider,
  WhatsAppProvider,
  EmailTemplateService,
} from './services';
import { NotificationListener } from './listeners/notification.listener';

// Register model with the model registry
modelRegistry.register([NotificationLogModel]);

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([NotificationLogModel]),
    // Note: EventEmitterModule must be imported globally in AppModule for events to work
    // Import EventEmitterModule.forRoot() in your app.module.ts
  ],
  controllers: [
    NotificationController,
    EmailTemplateController,
    WhatsAppWebhookController,
  ],
  providers: [
    NotificationService,
    LogService,
    TemplateService,
    EmailProvider,
    WhatsAppProvider,
    EmailTemplateService,
    NotificationListener,
  ],
  exports: [
    NotificationService,
    LogService,
    TemplateService,
    SequelizeModule,
  ],
})
export class NotificationModule {}
