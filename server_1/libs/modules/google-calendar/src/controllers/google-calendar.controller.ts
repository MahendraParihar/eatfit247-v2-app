import { BadRequestException, Controller, Get, Logger, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser, JwtAuthGuard, Public } from '@server_1/core';
import { GoogleService } from '@server_1/platform';
import { IGoogleCalendarStatus } from '@eatfit247-shared-lib';

@Controller('google-calendar')
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);
  
  constructor(private readonly googleService: GoogleService) {
    this.logger.log('GoogleCalendarController initialized');
  }

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
  @Get('test')
  async test(): Promise<{ status: string; message: string; timestamp: string }> {
    this.logger.log('Google Calendar test endpoint called');
    return {
      status: 'ok',
      message: 'Google Calendar module is loaded and working',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Google Calendar callback received - code: ${code ? 'present' : 'missing'}, state: ${state ? 'present' : 'missing'}`);
    
    if (!code || !state) {
      this.logger.warn('Invalid Google OAuth callback - missing code or state');
      throw new BadRequestException('Invalid Google OAuth callback');
    }
    
    try {
      this.logger.log('Processing Google OAuth callback...');
      const url = await this.googleService.handleCallback(code, state);
      this.logger.log(`Redirecting to: ${url}`);
      res.redirect(url);
    } catch (error) {
      this.logger.error('Error processing Google OAuth callback', error);
      throw error;
    }
  }
}
