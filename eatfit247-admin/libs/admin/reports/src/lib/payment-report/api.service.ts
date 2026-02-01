import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiBaseService } from '@core';
import { IDropdownItem, IPaymentReportFilter, IPaymentReportItem, ITableList } from '@eatfit247-shared-lib';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';

@Injectable({
  providedIn: 'root'
})
export class PaymentReportApiService extends ApiBaseService {
  private readonly endpoint = '/reports/payment';
  private readonly baseUrl: string;
  private readonly http = inject(HttpClient);

  constructor() {
    super();
    this.baseUrl = environment.apiUrl;
  }

  async getPaymentReport(params: IPaymentReportFilter): Promise<ITableList<IPaymentReportItem>> {
    const res = await this.httpService.post<ITableList<IPaymentReportItem>>(this.endpoint, params);
    return res.data as ITableList<IPaymentReportItem>;
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }

  async exportPaymentReports(params: IPaymentReportFilter): Promise<Blob> {
    // Normalize URL to avoid double slashes
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const endpointPath = this.endpoint.startsWith('/') ? this.endpoint.slice(1) : this.endpoint;
    const url = `${baseUrl}/${endpointPath}/export`;
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof IPaymentReportFilter];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return await firstValueFrom(
      this.http.post(url, params, {
        responseType: 'blob',
        withCredentials: true
      })
    );
  }
}

