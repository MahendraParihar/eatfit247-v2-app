import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../database/db.model-list';
import { EmailTemplateService } from './email-template.service';
import { EmailService } from './email.service';

@Module({
  imports: [
    SequelizeModule.forFeature(ModelList),
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          pool: true,
          host: config.get('MAIL_HOST'),
          secure: false,
          port: config.get('MAIL_PORT'),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },

        defaults: {},
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class MailModule {}
