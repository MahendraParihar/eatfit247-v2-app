import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Public } from '@server_1/core';
import { LegalPagesService } from '../../services';
import { IPublicLegalPage } from '@eatfit247-shared-lib';

@Public()
@Controller('legal-page')
@UseGuards(JwtAuthGuard)
export class PublicLegalPagesController {
  constructor(private readonly service: LegalPagesService) {}

  @Get('url/:url')
  async getByUrl(@Param('url') url: string): Promise<IPublicLegalPage | null> {
    // Decode URL if it's encoded
    const decodedUrl = decodeURIComponent(url);
    return await this.service.findByUrl(decodedUrl);
  }
}

