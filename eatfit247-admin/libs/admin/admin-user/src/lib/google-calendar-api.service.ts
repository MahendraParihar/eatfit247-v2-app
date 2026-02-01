import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import { IGoogleCalendarStatus } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarApiService extends ApiBaseService {
  private readonly endpoint = '/google-calendar';

  constructor() {
    super();
  }

  async getStatus(): Promise<IGoogleCalendarStatus> {
    const res = await this.httpService.get<IGoogleCalendarStatus>(
      `${this.endpoint}/status`,
    );
    return res.data as IGoogleCalendarStatus;
  }

  async connect(): Promise<{ redirectUrl: string }> {
    const res = await this.httpService.get<{ redirectUrl: string }>(
      `${this.endpoint}/connect`,
    );
    return res.data as { redirectUrl: string };
  }

  async disconnect(): Promise<boolean> {
    const res = await this.httpService.get<boolean>(
      `${this.endpoint}/disconnect`,
    );
    return res.data as boolean;
  }
}
