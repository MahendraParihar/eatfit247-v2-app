import { Injectable } from '@nestjs/common';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { AppConfigService } from '../app-config';
import { LogErrorService } from '../services';
import { google } from 'googleapis';
import { CryptoUtil } from '../utils/crypto.util';
import { ConfigParam, IAvailableSlot, ICallLogSlot, IGoogleCalendarStatus } from 'eatfit247-shared-lib';
import { InjectModel } from '@nestjs/sequelize';
import { MstAdminUser } from '../models';
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
    projectID = 'vansh-suthar-barwa',
    recaptchaKey = '6LdjiR0rAAAAAMtMlbbCfzxVdf-12wA_y3yXFzZW',
    token = 'action-token',
    recaptchaAction = 'action-name',
  }) {
    const configValues = await this.appConfig.getString('project_id');
    // Create the reCAPTCHA client.
    // TODO: Cache the client generation code (recommended) or call client.close() before exiting the method.
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
    if (!response.tokenProperties.valid) {
      await this.logErrorService.logWarning(
        `The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`,
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
      await this.logErrorService.logWarning(
        `The reCAPTCHA score is: ${response.riskAnalysis.score}`,
        {
          controller: 'GoogleService',
          methodName: 'validateCaptcha',
        },
      );
      for (const reason of response.riskAnalysis.reasons) {
        await this.logErrorService.logWarning(String(reason), {
          controller: 'GoogleService',
          methodName: 'validateCaptcha',
        });
      }
      return response.riskAnalysis.score;
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
  // region Calendar
  private createGoogleOAuthClient() {
    return new google.auth.OAuth2(
      this.appConfig.getString(ConfigParam.GOOGLE_CLIENT_ID),
      this.appConfig.getString(ConfigParam.GOOGLE_CLIENT_SECRET),
      this.appConfig.getString(ConfigParam.GOOGLE_REDIRECT_URI),
    );
  }

  async disconnect(adminId: number) {
    await this.mstAdminUser.update(
      {
        googleRefreshToken: null,
        googleCalendarEmail: null,
        googleTokenCreatedAt: null,
      },
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
    console.log('adminId', oauthClient);
    const state = CryptoUtil.encryptData(adminId.toString());
    return {
      redirectUrl: oauthClient.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [this.appConfig.getString(ConfigParam.GOOGLE_CALENDAR_SCOPE)],
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
          googleRefreshToken: CryptoUtil.encryptData(tokens.refresh_token),
          googleCalendarEmail: calendarInfo.data.id,
          googleTokenCreatedAt: new Date(),
          googleCalendarTimezone: calendarInfo.data.timeZone,
        },
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
      const workStart = day.clone().hour(workingHoursStart[0]).minute(workingHoursStart[1]).second(0);
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
    try {
      const timezone = nutritionist.googleCalendarTimezone || this.appConfig.getString(ConfigParam.CALENDAR_TIMEZONE, true, 'Asia/Kolkata');
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
      console.log(requestBody);
      const fb = await calendar.freebusy.query({
        requestBody: requestBody,
      });
      const busy = (fb.data.calendars[nutritionist.googleCalendarEmail]?.busy || []) as {
        start: string;
        end: string;
      }[];
      console.log('------------------');
      console.log(busy);
      const workingHoursConfig = this.appConfig
        .getString(ConfigParam.CALENDAR_WORKING_HOURS)
        .split('-');
      const workingHours = { start: workingHoursConfig[0], end: workingHoursConfig[1] };
      const slotStepMinutes = this.appConfig.getNumber(
        ConfigParam.CALENDAR_SLOT_STEP_MINUTES,
        true,
        15,
      );
      const maxSlots = this.appConfig.getNumber(ConfigParam.CALENDAR_MAX_SLOT, true, 10);
      return this.generateSlots(busy, payload, slotStepMinutes, maxSlots, workingHours, timezone);
    } catch (e) {
      console.log(e);
    }
  }

  // endregion
}

