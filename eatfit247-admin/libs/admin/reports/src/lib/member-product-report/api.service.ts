import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiBaseService } from '@core';
import { IDropdownItem, IMemberProductReportFilter, IMemberProductReportItem, ITableList } from '@eatfit247-shared-lib';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';

@Injectable({
  providedIn: 'root'
})
export class MemberProductReportApiService extends ApiBaseService {
  private readonly endpoint = '/reports/member-product';
  private readonly baseUrl: string;
  private readonly http = inject(HttpClient);

  constructor() {
    super();
    this.baseUrl = environment.apiUrl;
  }

  async getMemberProductReport(params: IMemberProductReportFilter): Promise<ITableList<IMemberProductReportItem>> {
    const res = await this.httpService.post<ITableList<IMemberProductReportItem>>(this.endpoint, params);
    return res.data as ITableList<IMemberProductReportItem>;
  }

  async getFranchiseDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/franchise/dropdown');
    return res.data as IDropdownItem[];
  }

  async getPaymentStatusDropdown(): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/lov/payment-status/dropdown');
    return res.data as IDropdownItem[];
  }

  async exportMemberProductReports(params: IMemberProductReportFilter): Promise<Blob> {
    // Normalize URL to avoid double slashes
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const endpointPath = this.endpoint.startsWith('/') ? this.endpoint.slice(1) : this.endpoint;
    const url = `${baseUrl}/${endpointPath}/export`;
    
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof IMemberProductReportFilter];
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

