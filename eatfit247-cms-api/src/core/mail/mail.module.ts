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
      useFactory: async (config: ConfigService) => {
        const mailHost = config.get('MAIL_HOST');
        const mailPort = config.get('MAIL_PORT');
        const mailUser = config.get('MAIL_USER');
        const mailPassword = config.get('MAIL_PASSWORD');
        const enableMail = config.get('ENABLE_MAIL', 'true');

        // If mail is disabled or credentials are missing, use a dummy transport
        if (enableMail === 'false' || !mailHost || !mailUser || !mailPassword) {
          console.log('Mail service disabled or incomplete configuration. Using dummy transport.');
          return {
            transport: {
              jsonTransport: true, // Use dummy transport for testing
            },
            defaults: {},
          };
        }

        return {
          transport: {
            pool: true,
            host: mailHost,
            secure: false,
            port: parseInt(mailPort) || 587,
            auth: {
              user: mailUser,
              pass: mailPassword,
            },
            // Handle self-signed certificates
            tls: {
              rejectUnauthorized: false,
            },
            // Additional SSL options
            ignoreTLS: false,
            requireTLS: true,
          },
          defaults: {},
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class MailModule {}
