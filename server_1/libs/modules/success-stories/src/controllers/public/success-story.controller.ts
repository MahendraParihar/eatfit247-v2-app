import { Controller, Get, Query } from '@nestjs/common';
import { BasicSearchDto, Public } from '@server_1/core';
import { SuccessStoryService } from '../../services';
import { IGoogleReviewsResponse, ISuccessStory, ITableList } from '@eatfit247-shared-lib';
import { GoogleService } from '@server_1/platform';

@Public()
@Controller('success-story')
export class PublicSuccessStoryController {
  constructor(
    private readonly service: SuccessStoryService,
    private readonly googleService: GoogleService,
  ) {}

  @Get('list')
  async list(
    @Query() req: BasicSearchDto & { active?: boolean },
  ): Promise<ITableList<ISuccessStory>> {
    // For public endpoints, only show active success stories by default
    const searchDto: BasicSearchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAll(searchDto);
  }

  @Get('google-reviews')
  async getGoogleReviews(@Query('placeId') placeId?: string): Promise<IGoogleReviewsResponse> {
    return await this.googleService.getGoogleBusinessReviews(placeId);
  }
}

