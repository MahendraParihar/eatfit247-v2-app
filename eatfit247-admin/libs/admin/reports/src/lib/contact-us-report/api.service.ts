import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IContactFormReportFilter, IContactFormReportItem, ISendResponseDto, ITableList } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root'
})
export class ContactFormReportApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/reports/contact-form';

  async getContactFormReport(params: IContactFormReportFilter): Promise<ITableList<IContactFormReportItem>> {
    const res = await this.httpService.post<ITableList<IContactFormReportItem>>(this.endpoint, params);
    return res.data as ITableList<IContactFormReportItem>;
  }

  async getContactFormDetails(contactFormId: number): Promise<IContactFormReportItem> {
    const res = await this.httpService.get<IContactFormReportItem>(`${this.endpoint}/${contactFormId}`);
    return res.data as IContactFormReportItem;
  }

  async sendResponse(contactFormId: number, dto: ISendResponseDto): Promise<void> {
    await this.httpService.put(`${this.endpoint}/${contactFormId}/response`, dto);
  }
}

