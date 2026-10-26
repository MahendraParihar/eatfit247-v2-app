import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { HttpService, SUPPRESS_ERROR_NOTIFICATION } from '@core';
import {
  ICalculateTaxResponse,
  IDropdownItem,
  IManageWorkshopInvoice,
  ITableList,
  IWorkshopInvoice,
  IWorkshopInvoiceMasterData,
  IWorkshopInvoiceSearch,
  IWorkshopInvoiceTaxRequest,
} from '@eatfit247-shared-lib';

export interface IWorkshopInvoiceFile {
  fileName: string;
  buffer: string;
}

/** Error shape thrown by HttpErrorInterceptor (AppError). */
export interface IWorkshopInvoiceApiError {
  status: number;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkshopInvoiceApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/workshop-invoice';

  async getMasterData(): Promise<IWorkshopInvoiceMasterData> {
    const res = await this.httpService.get<IWorkshopInvoiceMasterData>(`${this.endpoint}/master-data`);
    return res.data as IWorkshopInvoiceMasterData;
  }

  async getStates(countryId: number): Promise<IDropdownItem[]> {
    const res = await this.httpService.get<IDropdownItem[]>('/state/dropdown', { params: { countryId } });
    return res.data as IDropdownItem[];
  }

  async getList(search: IWorkshopInvoiceSearch): Promise<ITableList<IWorkshopInvoice>> {
    const res = await this.httpService.get<ITableList<IWorkshopInvoice>>(this.endpoint, { params: search });
    return res.data as ITableList<IWorkshopInvoice>;
  }

  async getById(id: number): Promise<IWorkshopInvoice> {
    const res = await this.httpService.get<IWorkshopInvoice>(`${this.endpoint}/${id}`);
    return res.data as IWorkshopInvoice;
  }

  /** Live preview; errors are shown inline by the form, so the global snackbar is suppressed. */
  async calculateTax(payload: IWorkshopInvoiceTaxRequest): Promise<ICalculateTaxResponse> {
    const res = await this.httpService.post<ICalculateTaxResponse>(`${this.endpoint}/calculate-tax`, payload, {
      context: new HttpContext().set(SUPPRESS_ERROR_NOTIFICATION, true),
    });
    return res.data as ICalculateTaxResponse;
  }

  /**
   * Create (no id) or update. A 409 means the invoice date is earlier than the series'
   * latest; the form asks for confirmation, so that error is not shown as a snackbar.
   */
  async save(payload: IManageWorkshopInvoice, id?: number): Promise<IWorkshopInvoice> {
    const options = { context: new HttpContext().set(SUPPRESS_ERROR_NOTIFICATION, true) };
    const res = id
      ? await this.httpService.put<IWorkshopInvoice>(`${this.endpoint}/${id}`, payload, options)
      : await this.httpService.post<IWorkshopInvoice>(this.endpoint, payload, options);
    return res.data as IWorkshopInvoice;
  }

  async cancel(id: number, cancelReason: string): Promise<IWorkshopInvoice> {
    const res = await this.httpService.put<IWorkshopInvoice>(`${this.endpoint}/${id}/cancel`, { cancelReason });
    return res.data as IWorkshopInvoice;
  }

  async downloadInvoice(id: number): Promise<IWorkshopInvoiceFile> {
    const res = await this.httpService.get<IWorkshopInvoiceFile>(`${this.endpoint}/${id}/invoice`);
    return res.data as IWorkshopInvoiceFile;
  }
}
