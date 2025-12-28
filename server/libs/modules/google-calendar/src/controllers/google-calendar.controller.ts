import { BadRequestException, Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser, GoogleService, JwtAuthGuard, Public } from '@server/common';
import { GoogleCalendarService } from '../services';
import { IGoogleCalendarStatus } from 'eatfit247-shared-lib';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleService: GoogleService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@CurrentUser() currentUser: any): Promise<IGoogleCalendarStatus> {
    return this.googleService.getStatus(currentUser.adminId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connect')
  async connect(@CurrentUser() currentUser: any) {
    return await this.googleService.startOAuth(currentUser.adminId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('disconnect')
  async disconnect(@CurrentUser() currentUser: any): Promise<boolean> {
    await this.googleService.disconnect(currentUser.adminId);
    return true;
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!code || !state) {
      throw new BadRequestException('Invalid Google OAuth callback');
    }
    const url = await this.googleService.handleCallback(code, state);
    res.redirect(url);
  }
}
