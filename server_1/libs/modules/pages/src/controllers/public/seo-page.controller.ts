import { Controller, Get, Param } from '@nestjs/common';
import { ISeoPageData } from '@eatfit247-shared-lib';
import { SeoPageService } from '@server_1/platform';
import { Public } from '@server_1/core';

@Public()
@Controller('seo-page')
export class SeoPageController {
  constructor(private readonly service: SeoPageService) {}

  @Get('url/:url')
  async getByUrl(@Param('url') url: string): Promise<ISeoPageData | null> {
    // Decode URL if it's encoded
    const decodedUrl = decodeURIComponent(url);
    return await this.service.findByUrl(decodedUrl);
  }

  @Get('all')
  async getAll(): Promise<ISeoPageData[]> {
    return await this.service.findAll();
  }
}

