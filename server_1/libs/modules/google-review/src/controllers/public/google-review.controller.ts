import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@server_1/core';
import { GoogleReviewService } from '../../services';
import { PublicGoogleReviewQueryDto } from '../../dto';
import { IPublicGoogleReview, IPublicTableList } from '@eatfit247-shared-lib';

@Public()
@Controller('google-review')
export class PublicGoogleReviewController {
  constructor(private readonly service: GoogleReviewService) {}

  @Get('by-entity')
  async byEntity(@Query() req: PublicGoogleReviewQueryDto): Promise<IPublicTableList<IPublicGoogleReview>> {
    return await this.service.findPublicByEntity(
      req.entityType,
      req.entityId,
      req.page || 0,
      req.limit || 15,
    );
  }
}
