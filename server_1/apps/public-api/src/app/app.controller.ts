import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppConfigService, Public } from '@server_1/core';
import { ConfigParam } from 'eatfit247-shared-library';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Public endpoint to fetch the Google reCAPTCHA v3 site key
   * The value is loaded from mst_configs via AppConfigService.
   *
   * Route: GET /api/v2/public/config/recaptcha-site-key
   */
  @Public()
  @Get('config/recaptcha-site-key')
  getRecaptchaSiteKey(): { siteKey: string | null } {
    // Config name is stored in mst_configs.config_name
    const siteKey = this.appConfigService.getString(ConfigParam.GOOGLE_RECAPTCHA_SITE_KEY);
    return {
      siteKey,
    };
  }
}

