import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { GoogleService } from '@server_1/platform';
import { BasicSearchDto, UpdateActiveDto } from '@server_1/core';
import { PressMediaService } from '../../services';
import { CreatePressMediaDto } from '../../dto';
import { IPressMedia, ITableList } from '@eatfit247-shared-lib';

@Controller('press-media')
@UseGuards(JwtAuthGuard)
export class PressMediaController {
  constructor(
    private readonly service: PressMediaService,
    private readonly googleService: GoogleService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IPressMedia>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IPressMedia> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreatePressMediaDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreatePressMediaDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  /**
   * Cron job to fetch and save latest YouTube video
   * Runs daily at midnight (00:00:00)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async fetchAndSaveLatestYouTubeVideo(): Promise<void> {
    try {
      // Fetch latest YouTube video
      const videos = await this.googleService.fetchAndSaveLatestYouTubeVideo();
      
      if (!videos || videos.length === 0) {
        return;
      }

      // Use system admin ID (1) for cron job operations
      const systemAdminId = 1;
      const systemIp = '0.0.0.0'; // System IP for cron jobs

      // Process each video (usually just one)
      for (const video of videos) {
        const saved = await this.service.saveYouTubeVideoIfNotExists(
          video.title,
          video.link,
          systemIp,
          systemAdminId,
        );
        
        if (saved) {
          console.log(`Successfully saved YouTube video: ${video.title} - ${video.link}`);
        } else {
          console.log(`Skipped YouTube video (already exists): ${video.link}`);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchAndSaveLatestYouTubeVideo cron job:', error.message);
      // Don't throw error to prevent cron job from failing
    }
  }
}

