import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import {
  IBasicSearch,
  IRateQuote,
  IShipmentDetails,
  ITableList,
  ITrackingInfo,
  IResponse
} from '@eatfit247-shared-lib';
import { IAddItemsPayload, ISelectRatePayload } from './models/shipment.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryApiService extends ApiBaseService {
  private readonly endpoint = '/delivery';

  constructor() {
    super();
  }

  async getShipmentDetails(id: number): Promise<IShipmentDetails> {
    const res = await this.httpService.get<IShipmentDetails>(
      `${this.endpoint}/shipments/${id}`
    );
    return res.data as IShipmentDetails;
  }

  async getShipmentByOrderId(orderId: number): Promise<IShipmentDetails | null> {
    try {
      const res = await this.httpService.get<ITableList<IShipmentDetails>>(
        `${this.endpoint}/shipments/list`,
        { params: <IBasicSearch>{ ids: [orderId], limit: 1 } }
      );
      const tableList = res.data;
      const shipments = tableList?.tableData || [];
      return shipments.length > 0 ? shipments[0] : null;
    } catch {
      return null;
    }
  }

  async createShipmentForOrder(orderId: number): Promise<IShipmentDetails> {
    const res = await this.httpService.post<IShipmentDetails>(
      `${this.endpoint}/shipments`,
      { orderId }
    );
    return res.data as IShipmentDetails;
  }

  async createDraft(memberProductId: number): Promise<IShipmentDetails> {
    const res = await this.httpService.post<IShipmentDetails>(
      `${this.endpoint}/create-draft`,
      { memberProductId }
    );
    return res.data as IShipmentDetails;
  }

  async addItems(id: number, payload: IAddItemsPayload): Promise<IShipmentDetails> {
    const res = await this.httpService.post<IShipmentDetails>(
      `${this.endpoint}/${id}/items`,
      payload
    );
    return res.data as IShipmentDetails;
  }

  async getRates(id: number): Promise<IRateQuote[]> {
    const res = await this.httpService.post<IRateQuote[]>(
      `${this.endpoint}/${id}/rates`,
      {}
    );
    return res.data as IRateQuote[];
  }

  async selectRate(id: number, providerId: number): Promise<IShipmentDetails> {
    const payload: ISelectRatePayload = { providerId };
    const res = await this.httpService.post<IShipmentDetails>(
      `${this.endpoint}/${id}/select-rate`,
      payload
    );
    return res.data as IShipmentDetails;
  }

  async bookShipment(id: number): Promise<IShipmentDetails> {
    const res = await this.httpService.post<IShipmentDetails>(
      `${this.endpoint}/${id}/book`,
      {}
    );
    return res.data as IShipmentDetails;
  }

  async getTracking(id: number): Promise<ITrackingInfo> {
    const res = await this.httpService.get<ITrackingInfo>(
      `${this.endpoint}/${id}/tracking`
    );
    return res.data as ITrackingInfo;
  }

  async retryBooking(id: number): Promise<IShipmentDetails> {
    const res = await this.httpService.post<IShipmentDetails>(
      `${this.endpoint}/${id}/book`,
      {}
    );
    return res.data as IShipmentDetails;
  }
}

