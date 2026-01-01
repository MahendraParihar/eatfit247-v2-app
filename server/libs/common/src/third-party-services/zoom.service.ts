import { Injectable } from '@nestjs/common';
import { ConfigParam, IZoomEvent } from '@eatfit247-shared-lib';
import moment from 'moment-timezone';
import axios from 'axios';
import { AppConfigService } from '../app-config';

@Injectable()
export class ZoomService {
  constructor(private readonly appConfigService: AppConfigService) {}

  async getZoomAccessToken() {
    const res = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'account_credentials',
        account_id: this.appConfigService.get(ConfigParam.ZOOM_ACCOUNT_ID),
      },
      auth: {
        username: this.appConfigService.get(ConfigParam.ZOOM_CLIENT_ID),
        password: this.appConfigService.get(ConfigParam.ZOOM_CLIENT_SECRET),
      },
    });
    return res.data.access_token;
  }

  // region Calendar
  async bookMeeting(topic: string, dateRange: { start: string; end: string }, type: number = 2): Promise<IZoomEvent> {
    const token = await this.getZoomAccessToken();
    const res = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: topic,
        type: type, // scheduled
        start_time: dateRange.start,
        duration: moment(dateRange.end).diff(dateRange.start, 'minutes'),
        timezone: 'UTC',
        settings: {
          join_before_host: false,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.data as IZoomEvent;
  }

  async deleteMeeting(event: IZoomEvent): Promise<void> {
    const token = await this.getZoomAccessToken();
    await axios.delete(`https://api.zoom.us/v2/meetings/${event.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateMeeting(event: IZoomEvent, dateRange: { start: string; end: string }): Promise<void> {
    const token = await this.getZoomAccessToken();
    await axios.patch(
      `https://api.zoom.us/v2/meetings/${event.id}`,
      {
        start_time: dateRange.start,
        duration: moment(dateRange.end).diff(dateRange.start, 'minutes'),
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  // endregion
}

