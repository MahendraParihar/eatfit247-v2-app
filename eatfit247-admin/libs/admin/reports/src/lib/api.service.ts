import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiBaseService, HttpService } from '@core';
import { IMemberPayment, ITableList, IDropdownItem } from '@eatfit247-shared-lib';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';

export interface PaymentReportFilter {
  startDate: string;
  endDate: string;
  franchiseId?: number;
}

export interface PaymentReportItem extends IMemberPayment {
  franchiseName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentReportApiService extends ApiBaseService {
  private readonly endpoint = '/reports/payment';
  private readonly baseUrl: string;

  constructor(httpService: HttpService, private http: HttpClient) {
    super(httpService);
    this.baseUrl = environment.apiUrl;
  }

  async getPaymentReport(params: PaymentReportFilter): Promise<ITableList<PaymentReportItem>> {
    const res = await this.httpService.get<ITableList<PaymentReportItem>>(this.endpoint, { params });
    return res.data as ITableList<PaymentReportItem>;
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }

  async exportPaymentReports(params: PaymentReportFilter): Promise<Blob> {
    // Normalize URL to avoid double slashes
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const endpointPath = this.endpoint.startsWith('/') ? this.endpoint.slice(1) : this.endpoint;
    const url = `${baseUrl}/${endpointPath}/export`;
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof PaymentReportFilter];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    const blob = await firstValueFrom(
      this.http.get(url, {
        params: httpParams,
        responseType: 'blob',
        withCredentials: true,
      })
    );
    return blob;
  }
}

