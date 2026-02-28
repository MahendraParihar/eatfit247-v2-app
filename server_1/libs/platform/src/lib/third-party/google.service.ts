import { BadRequestException, Injectable } from '@nestjs/common';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { AppConfigService, CryptoUtil, MstAdminUser } from '@server_1/core';
import { LogErrorService } from '../logging/log-error.service';
import { google } from 'googleapis';
import axios from 'axios';
import {
  ConfigParam,
  IAvailableSlot,
  ICallLogSlot,
  IGoogleCalendarEvent,
  IGoogleCalendarStatus,
  IGoogleReviewsResponse,
} from '@eatfit247-shared-lib';
import { InjectModel } from '@nestjs/sequelize';
import moment from 'moment-timezone';

@Injectable()
export class GoogleService {
  constructor(
    private appConfig: AppConfigService,
    private logErrorService: LogErrorService,
    @InjectModel(MstAdminUser) private readonly mstAdminUser: typeof MstAdminUser,
  ) {}

  // region Google Captcha
  async validateCaptcha({
    // TO-DO: Replace the token and reCAPTCHA action variables before running the sample.
    projectID = this.appConfig.getString(ConfigParam.GOOGLE_PROJECT_ID),
    recaptchaKey = this.appConfig.getString(ConfigParam.GOOGLE_RECAPTCHA_SITE_KEY),
    token = 'action-token',
    recaptchaAction = 'action-name',
  }) {
    const configValues = this.appConfig.getString(ConfigParam.GOOGLE_PROJECT_ID);
    // Create the reCAPTCHA client.
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);
    // Build the assessment request.
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };
    const [response] = await client.createAssessment(request);
    // Check if the token is valid.
    if (!response.tokenProperties?.valid) {
      await this.logErrorService.logWarning(
        `The CreateAssessment call failed because the token was: ${response.tokenProperties?.invalidReason}`,
        {
          controller: 'GoogleService',
          methodName: 'validateCaptcha',
        },
      );
      return null;
    }
    // Check if the expected action was executed.
    // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
    if (response.tokenProperties.action === recaptchaAction) {
      // Get the risk score and the reason(s).
      // For more information on interpreting the assessment, see:
      // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
      if (response.riskAnalysis) {
        await this.logErrorService.logWarning(
          `The reCAPTCHA score is: ${response.riskAnalysis.score}`,
          {
            controller: 'GoogleService',
            methodName: 'validateCaptcha',
          },
        );
        if (response.riskAnalysis.reasons) {
          for (const reason of response.riskAnalysis.reasons) {
            await this.logErrorService.logWarning(String(reason), {
              controller: 'GoogleService',
              methodName: 'validateCaptcha',
            });
          }
        }
        return response.riskAnalysis.score;
      }
      return 0;
    } else {
      await this.logErrorService.logWarning(
        'The action attribute in your reCAPTCHA tag does not match the action you are expecting to score',
        {
          controller: 'GoogleService',
          methodName: 'validateCaptcha',
        },
      );
      return null;
    }
  }

  // endregion
  // region reCAPTCHA v3 (Standard API)
  /**
   * Verify reCAPTCHA v3 token using standard Google API
   * This is simpler than Enterprise and doesn't require Google Cloud Project setup
   *
   * @param token - The reCAPTCHA token from the frontend
   * @param remoteIp - Optional: The user's IP address for additional verification
   * @param scoreThreshold - Optional: Minimum score to accept (default: 0.5)
   * @returns Promise with verification result
   */
  async verifyRecaptchaV3(
    token: string,
    remoteIp?: string,
    scoreThreshold: number = 0.5,
  ): Promise<{ success: boolean; score?: number; action?: string; errorCodes?: string[] }> {
    const secretKey = this.appConfig.getString(ConfigParam.GOOGLE_RECAPTCHA_SECRET_KEY);
    if (!secretKey) {
      throw new BadRequestException('reCAPTCHA secret key not configured');
    }
    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }
    try {
      const params = new URLSearchParams({
        secret: secretKey,
        response: token,
      });
      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }
      const response = await axios.post<{
        success: boolean;
        score?: number;
        action?: string;
        challenge_ts?: string;
        hostname?: string;
        'error-codes'?: string[];
      }>('https://www.google.com/recaptcha/api/siteverify', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const result = response.data;
      if (!result.success) {
        const errorCodes = result['error-codes'] || [];
        throw new BadRequestException(`reCAPTCHA verification failed: ${errorCodes.join(', ')}`);
      }
      // Check the score threshold for v3
      if (result.score !== undefined && result.score < scoreThreshold) {
        throw new BadRequestException(
          `reCAPTCHA score ${result.score} is below threshold ${scoreThreshold}`,
        );
      }
      return {
        success: result.success,
        score: result.score,
        action: result.action,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to verify reCAPTCHA token: ${error.message}`);
    }
  }

  /**
   * Verify reCAPTCHA v3 token with a specific action
   * @param token - The reCAPTCHA token from the frontend
   * @param expectedAction - The expected action name
   * @param remoteIp - Optional: The user's IP address
   * @param scoreThreshold - Optional: Minimum score to accept (default: 0.5)
   * @returns Promise with verification result
   */
  async verifyRecaptchaV3WithAction(
    token: string,
    expectedAction: string,
    remoteIp?: string,
    scoreThreshold: number = 0.5,
  ): Promise<{ success: boolean; score?: number; action?: string }> {
    const result = await this.verifyRecaptchaV3(token, remoteIp, scoreThreshold);
    if (result.action !== expectedAction) {
      throw new BadRequestException(
        `reCAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${result.action}`,
      );
    }
    return result;
  }

  // endregion
  // region Calendar
  private createGoogleOAuthClient() {
    return new google.auth.OAuth2(
      this.appConfig.getString(ConfigParam.GOOGLE_CLIENT_ID),
      this.appConfig.getString(ConfigParam.GOOGLE_CLIENT_SECRET),
      this.appConfig.getString(ConfigParam.GOOGLE_REDIRECT_URI),
    );
  }

  private getGoogleCalendarClient(googleRefreshToken: string) {
    if (!googleRefreshToken) {
      throw new Error('Google Calendar not connected');
    }
    const oauthClient = this.createGoogleOAuthClient();
    oauthClient.setCredentials({
      refresh_token: CryptoUtil.decryptData(googleRefreshToken),
    });
    return google.calendar({
      version: 'v3',
      auth: oauthClient,
    });
  }

  async disconnect(adminId: number) {
    await this.mstAdminUser.update(
      {
        googleRefreshToken: undefined,
        googleCalendarEmail: undefined,
        googleTokenCreatedAt: undefined,
      } as any,
      {
        where: { adminId: adminId },
      },
    );
  }

  async getStatus(adminId: number): Promise<IGoogleCalendarStatus> {
    const admin = await this.mstAdminUser.findOne({
      where: { adminId: adminId },
    });
    if (!admin?.googleRefreshToken) {
      return {
        connected: false,
      };
    }
    return <IGoogleCalendarStatus>{
      connected: true,
      email: admin.googleCalendarEmail,
      connectedAt: admin.googleTokenCreatedAt,
    };
  }

  public async startOAuth(adminId: number) {
    const oauthClient = this.createGoogleOAuthClient();
    const state = CryptoUtil.encryptData(adminId.toString());
    return {
      redirectUrl: oauthClient.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [this.appConfig.getString(ConfigParam.GOOGLE_CALENDAR_SCOPE) || ''],
        state,
      }),
    };
  }

  public async handleCallback(code: string, state: string) {
    const frontendUrl = this.appConfig.getString(ConfigParam.CLIENT_URL);
    try {
      const oauthClient = this.createGoogleOAuthClient();
      const adminId = CryptoUtil.decryptData(state);
      const { tokens } = await oauthClient.getToken(code);
      oauthClient.setCredentials(tokens);
      const calendar = google.calendar({
        version: 'v3',
        auth: oauthClient,
      });
      const calendarInfo = await calendar.calendarList.get({
        calendarId: 'primary',
      });
      await this.mstAdminUser.update(
        {
          googleRefreshToken: tokens.refresh_token
            ? CryptoUtil.encryptData(tokens.refresh_token)
            : undefined,
          googleCalendarEmail: calendarInfo.data.id || undefined,
          googleTokenCreatedAt: new Date(),
          googleCalendarTimezone: calendarInfo.data.timeZone || undefined,
        } as any,
        { where: { adminId: adminId } },
      );
      return `${frontendUrl}/setting?calendar=connected`;
    } catch (error) {
      return `${frontendUrl}/setting?calendar=error`;
    }
  }

  private buildDateTime(date: Date, time: string, timezone: string): moment.Moment {
    const [hh, mm] = time.split(':').map(Number);
    // Create moment from date and set the time
    // Google Calendar API returns busy slots in the timezone specified, so we work with local dates
    return moment(date).hour(hh).minute(mm).second(0).millisecond(0);
  }

  private nowInTimezone(tz: string) {
    return moment().tz(tz);
  }

  private generateSlots(
    busy: { start: string; end: string }[],
    payload: IAvailableSlot,
    slotStepMinutes: number,
    maxSlots: number,
    workingHours: { start: string; end: string },
    timezone: string,
  ): ICallLogSlot[] {
    const slots: ICallLogSlot[] = [];
    const now = this.nowInTimezone(timezone);
    let day = moment.tz(payload.fromDate, timezone).startOf('day');
    const endDay = moment.tz(payload.toDate, timezone).startOf('day');
    const workingHoursStart = workingHours.start.split(':').map(Number);
    const workingHoursEnd = workingHours.end.split(':').map(Number);
    while (day.isSameOrBefore(endDay)) {
      // ❌ Skip past days
      if (day.isBefore(now, 'day')) {
        day.add(1, 'day');
        continue;
      }
      const workStart = day
        .clone()
        .hour(workingHoursStart[0])
        .minute(workingHoursStart[1])
        .second(0);
      const workEnd = day.clone().hour(workingHoursEnd[0]).minute(workingHoursEnd[1]).second(0);
      // ✅ Today → max(now, workStart)
      let cursor = day.isSame(now, 'day') ? moment.max(now, workStart) : workStart.clone();
      // ⛔ Past working hours
      if (cursor.isSameOrAfter(workEnd)) {
        day.add(1, 'day');
        continue;
      }
      // 🔄 Round UP to next 15-minute boundary
      const remainder = cursor.minute() % slotStepMinutes;
      if (remainder !== 0) {
        cursor.add(slotStepMinutes - remainder, 'minutes');
      }
      cursor.second(0);
      while (cursor.clone().add(payload.duration, 'minutes').isSameOrBefore(workEnd)) {
        const slotEnd = cursor.clone().add(payload.duration, 'minutes');
        const conflict = busy.some(
          (b) => moment(b.start).isBefore(slotEnd) && moment(b.end).isAfter(cursor),
        );
        if (!conflict) {
          slots.push({
            id: cursor.toISOString(),
            start: cursor.toDate(),
            end: slotEnd.toDate(),
          });
          if (slots.length >= maxSlots) {
            return slots;
          }
        }
        cursor.add(slotStepMinutes, 'minutes');
      }
      day.add(1, 'day');
    }
    return slots;
  }

  public async availableSlots(
    nutritionist: MstAdminUser,
    payload: IAvailableSlot,
  ): Promise<ICallLogSlot[]> {
    const timezone =
      nutritionist.googleCalendarTimezone ||
      this.appConfig.getString(ConfigParam.CALENDAR_TIMEZONE, true, 'Asia/Kolkata') ||
      'Asia/Kolkata';
    const oauthClient = this.createGoogleOAuthClient();
    oauthClient.setCredentials({
      refresh_token: CryptoUtil.decryptData(nutritionist.googleRefreshToken),
    });
    const calendar = google.calendar({
      version: 'v3',
      auth: oauthClient,
    });
    // If fromDate is today, use current time; otherwise use start of fromDate
    const fromDateMoment = moment(payload.fromDate);
    const now = moment();
    const timeMin = fromDateMoment.isSame(now, 'day')
      ? `${now.format()}`
      : `${fromDateMoment.startOf('day').format()}`;
    const timeMax = `${moment(payload.toDate).endOf('day').format()}`;
    const requestBody = {
      timeMin,
      timeMax,
      timeZone: timezone,
      items: [{ id: nutritionist.googleCalendarEmail }],
    };
    const fb = await calendar.freebusy.query({
      requestBody: requestBody,
    });
    const busy = (fb.data.calendars?.[nutritionist.googleCalendarEmail]?.busy || []) as {
      start: string;
      end: string;
    }[];
    const workingHoursConfig = (
      this.appConfig.getString(ConfigParam.CALENDAR_WORKING_HOURS) || '09:00-18:00'
    ).split('-');
    const workingHours = {
      start: workingHoursConfig[0] || '09:00',
      end: workingHoursConfig[1] || '18:00',
    };
    const slotStepMinutes =
      this.appConfig.getNumber(ConfigParam.CALENDAR_SLOT_STEP_MINUTES, true, 15) || 15;
    const maxSlots = this.appConfig.getNumber(ConfigParam.CALENDAR_MAX_SLOT, true, 10) || 10;
    return this.generateSlots(busy, payload, slotStepMinutes, maxSlots, workingHours, timezone);
  }

  async checkSlots(
    nutritionist: MstAdminUser,
    dateRange: { start: string; end: string },
  ): Promise<boolean> {
    const timezone =
      nutritionist.googleCalendarTimezone ||
      this.appConfig.getString(ConfigParam.CALENDAR_TIMEZONE, true, 'Asia/Kolkata');
    const calendar = this.getGoogleCalendarClient(nutritionist.googleRefreshToken);
    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: dateRange.start,
        timeMax: dateRange.end,
        timeZone: timezone,
        items: [{ id: 'primary' }],
      },
    });
    const busy = fb.data.calendars?.['primary']?.busy || [];
    const conflict = busy.some(
      (b) => moment(b.start).isBefore(dateRange.end) && moment(b.end).isAfter(dateRange.start),
    );
    if (conflict) {
      throw new BadRequestException('Selected slot already booked');
    }
    return conflict;
  }

  async bookSlot(
    nutritionist: MstAdminUser,
    isGoogleMeet: boolean,
    meetingLink: string,
    memberEmailId: string,
    notifyUser: boolean,
    dateRange: { start: string; end: string },
  ): Promise<IGoogleCalendarEvent> {
    const timezone =
      nutritionist.googleCalendarTimezone ||
      this.appConfig.getString(ConfigParam.CALENDAR_TIMEZONE, true, 'Asia/Kolkata');
    const calendar = this.getGoogleCalendarClient(nutritionist.googleRefreshToken);
    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: isGoogleMeet ? 1 : 0,
      requestBody: {
        summary: 'Nutrition Consultation',
        description: meetingLink ? `Zoom Link: ${meetingLink}` : undefined,
        start: {
          dateTime: dateRange.start,
          timeZone: timezone,
        },
        end: {
          dateTime: dateRange.end,
          timeZone: timezone,
        },
        attendees: notifyUser ? [{ email: memberEmailId }] : [],
        conferenceData: isGoogleMeet
          ? { createRequest: { requestId: `meet-${Date.now()}` } }
          : undefined,
      },
    });
    return event.data as unknown as IGoogleCalendarEvent;
  }

  async cancelSlot(nutritionist: MstAdminUser, event: IGoogleCalendarEvent): Promise<void> {
    const calendar = this.getGoogleCalendarClient(nutritionist.googleRefreshToken);
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: event.id,
    });
  }

  async updateSlot(
    nutritionist: MstAdminUser,
    event: IGoogleCalendarEvent,
    dateRange: {
      start: string;
      end: string;
    },
  ): Promise<void> {
    const calendar = this.getGoogleCalendarClient(nutritionist.googleRefreshToken);
    await calendar.events.update({
      calendarId: 'primary',
      eventId: event.id,
      requestBody: {
        start: {
          dateTime: dateRange.start,
        },
        end: {
          dateTime: dateRange.end,
        },
      },
    });
  }

  // endregion
  // region YouTube
  async fetchAndSaveLatestYouTubeVideo(
    channelId?: string,
  ): Promise<{ link: string; title: string }[]> {
    try {
      const youtubeApiKey = this.appConfig.getString(ConfigParam.GOOGLE_KEY);
      const defaultChannelId = this.appConfig.getString(ConfigParam.YOUTUBE_CHANNEL_ID);
      if (!youtubeApiKey) {
        throw new BadRequestException('YouTube API key is not configured');
      }
      const targetChannelId = channelId || defaultChannelId;
      if (!targetChannelId) {
        throw new BadRequestException('YouTube channel ID is required');
      }
      // Initialize YouTube Data API v3
      const youtube = google.youtube({
        version: 'v3',
        auth: youtubeApiKey,
      });
      // Fetch the latest video from the channel
      const response = await youtube.search.list({
        part: ['snippet'],
        channelId: targetChannelId,
        order: 'date',
        maxResults: 1,
        type: ['video'],
      });
      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException('No videos found in the channel');
      }
      return response.data.items.map((item) => ({
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        title: item.snippet.title,
      }));
    } catch (error: any) {
      await this.logErrorService.logError(
        `Failed to fetch and save YouTube video: ${error.message}`,
      );
      throw new BadRequestException(`Failed to fetch and save YouTube video: ${error.message}`);
    }
  }

  // endregion
  // region Google Business Profile Reviews
  /**
   * Fetch place ID from Google Places API using text search
   * @param input - The text query to search for (e.g., 'EatFit24by7')
   * @returns Promise with the place_id string or null if not found
   */
  async getPlaceId(input: string): Promise<string | null> {
    try {
      const apiKey = this.appConfig.getString(ConfigParam.GOOGLE_KEY);
      if (!apiKey) {
        throw new BadRequestException('Google API key is not configured');
      }
      if (!input) {
        throw new BadRequestException('Input text is required');
      }
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
        {
          params: {
            input: input,
            inputtype: 'textquery',
            fields: 'place_id,name',
            key: apiKey,
          },
        },
      );
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new BadRequestException(
          `Google Places API error: ${response.data.status} - ${
            response.data.error_message || 'Unknown error'
          }`,
        );
      }
      return response.data.candidates?.[0]?.place_id || null;
    } catch (error: any) {
      await this.logErrorService.logError(`Failed to fetch place ID: ${error.message}`, {
        controller: 'GoogleService',
        methodName: 'getPlaceId',
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch place ID: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Fetch user reviews from Google Business Profile using Places API
   * @param placeId - Optional Google Place ID. If not provided, will try to get from config
   * @returns Promise with reviews, average rating, and total review count
   */
  async getGoogleBusinessReviews(placeId?: string): Promise<IGoogleReviewsResponse> {
    try {
      const apiKey = this.appConfig.getString(ConfigParam.GOOGLE_KEY);
      if (!apiKey) {
        throw new BadRequestException('Google API key is not configured');
      }
      await this.getPlaceId('EatFit247');
      // Get place ID from parameter or config (you may want to add GOOGLE_PLACE_ID to ConfigParam)
      const targetPlaceId = placeId || this.appConfig.getString(ConfigParam.GOOGLE_PLACE_ID);
      if (!targetPlaceId) {
        throw new BadRequestException('Google Place ID is required');
      }
      // Use Google Places API to fetch place details including reviews
      const placesApiUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
      const response = await axios.get(placesApiUrl, {
        params: {
          place_id: targetPlaceId,
          fields: 'place_id,name,rating,user_ratings_total,reviews',
          key: apiKey,
        },
      });
      if (response.data.status !== 'OK') {
        throw new BadRequestException(
          `Google Places API error: ${response.data.status} - ${
            response.data.error_message || 'Unknown error'
          }`,
        );
      }
      const placeData = response.data.result;
      // Transform reviews to match the expected format
      const reviews = (placeData.reviews || []).map((review: any, index: number) => {
        // Map star rating from number to enum
        const ratingMap: { [key: number]: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' } = {
          1: 'ONE',
          2: 'TWO',
          3: 'THREE',
          4: 'FOUR',
          5: 'FIVE',
        };
        return {
          reviewId:
            review.author_url || `review-${targetPlaceId}-${index}-${review.time || Date.now()}`,
          reviewer: {
            displayName: review.author_name || 'Anonymous',
            profilePhotoUrl: review.profile_photo_url,
          },
          starRating: ratingMap[review.rating] || 'FIVE',
          comment: review.text,
          createTime: review.time
            ? new Date(review.time * 1000).toISOString()
            : new Date().toISOString(),
          updateTime: review.time
            ? new Date(review.time * 1000).toISOString()
            : new Date().toISOString(),
          reviewReply: undefined, // Google Places API doesn't return reply information in standard format
        };
      });
      return {
        reviews,
        averageRating: placeData.rating,
        totalReviewCount: placeData.user_ratings_total,
      };
    } catch (error: any) {
      await this.logErrorService.logError(
        `Failed to fetch Google Business reviews: ${error.message}`,
        {
          controller: 'GoogleService',
          methodName: 'getGoogleBusinessReviews',
        },
      );
      // If it's a BadRequestException, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Otherwise, throw a generic error
      throw new BadRequestException(
        `Failed to fetch Google Business reviews: ${error.message || 'Unknown error'}`,
      );
    }
  }

  // endregion
}
