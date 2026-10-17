import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IDocumentsIssuedReport } from '@eatfit247-shared-lib';

export interface IDocumentsIssuedQuery {
  franchiseId: number;
  /** Inclusive, YYYY-MM-DD */
  from: string;
  to: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentsIssuedApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/reports/documents-issued';

  async getReport(query: IDocumentsIssuedQuery): Promise<IDocumentsIssuedReport> {
    const res = await this.httpService.get<IDocumentsIssuedReport>(this.endpoint, { params: { ...query } });
    return res.data as IDocumentsIssuedReport;
  }

  async downloadCsv(query: IDocumentsIssuedQuery): Promise<Blob> {
    const params = new URLSearchParams({ franchiseId: String(query.franchiseId), from: query.from, to: query.to });
    return await this.httpService.getBlob(`${this.endpoint}/csv?${params.toString()}`);
  }
}
