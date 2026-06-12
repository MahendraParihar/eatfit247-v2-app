import { Controller, Get, Query } from '@nestjs/common';
import { BasicSearchDto, Public } from '@server_1/core';
import { SuccessStoryService } from '../../services';
import { IGoogleBusinessReviewsResponse, ISuccessStory, ITableList } from '@eatfit247-shared-lib';
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
    @Query() req: BasicSearchDto,
  ): Promise<ITableList<ISuccessStory>> {
    // Public endpoint always restricts to active stories. The `showOnWebsite`
    // filter is opt-in by the caller (home page passes it; the full success
    // stories page does not, since it lists every active story).
    const searchDto: BasicSearchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAll(searchDto);
  }

  @Get('google-reviews')
  async getGoogleReviews(@Query('placeId') placeId?: string): Promise<IGoogleBusinessReviewsResponse> {
    return await this.googleService.getGoogleBusinessReviews(placeId);
  }
}

