import { BadRequestException, Injectable } from '@nestjs/common';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { AppConfigService } from '../app-config';
import { LogErrorService } from '../services';
import { google } from 'googleapis';
import { CryptoUtil } from '../utils/crypto.util';
import {
  ConfigParam,
  IAvailableSlot,
  ICallLogSlot,
  IGoogleCalendarEvent,
  IGoogleCalendarStatus, IZoomEvent,
} from 'eatfit247-shared-lib';
import { InjectModel } from '@nestjs/sequelize';
import { MstAdminUser } from '../models';
import moment from 'moment-timezone';

@Injectable()
export class ZoomService {
  constructor() {}

  // region Calendar
  async bookMeeting(dateRange: { start: string; end: string }): Promise<IZoomEvent> {
    const zoom = await this.zoomService.createMeeting({
      topic: 'Nutrition Consultation',
      start: dateRange.start,
      duration: moment(dateRange.end).diff(dateRange.start, 'minutes'),
    });
    return zoom as IZoomEvent;
  }

  async deleteMeeting(event: IZoomEvent): Promise<void> {
    await zoomApi.deleteMeeting(event.id);
  }

  async updateMeeting(event: IZoomEvent, duration: number): Promise<void> {
    await zoomApi.updateMeeting(event.id, {
      start_time: event.start_time,
      duration,
    });
  }

  // endregion
}

