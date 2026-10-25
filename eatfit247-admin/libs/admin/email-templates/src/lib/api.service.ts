import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IEmailTemplateSwitch, IUpdateEmailTemplateSwitch } from '@eatfit247-shared-lib';

/** Email / WhatsApp template switches (configurable tax treatment, decision 18). */
@Injectable({
  providedIn: 'root',
})
export class EmailTemplatesApiService {
  private readonly httpService = inject(HttpService);

  async list(): Promise<IEmailTemplateSwitch[]> {
    const res = await this.httpService.get<IEmailTemplateSwitch[]>('/email-template/list');
    return (res.data as IEmailTemplateSwitch[]) || [];
  }

  async update(emailTemplateId: number, changes: IUpdateEmailTemplateSwitch): Promise<IEmailTemplateSwitch> {
    const res = await this.httpService.patch<IEmailTemplateSwitch>(`/email-template/${emailTemplateId}`, changes);
    return res.data as IEmailTemplateSwitch;
  }
}
