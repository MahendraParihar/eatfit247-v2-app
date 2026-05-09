import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IGoogleCalendarStatus } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/google-calendar';

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
