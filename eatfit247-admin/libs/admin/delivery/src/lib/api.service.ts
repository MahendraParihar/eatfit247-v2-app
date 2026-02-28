import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core';
import {
  IBasicSearch,
  IRateQuote,
  IShipment,
  ITableList,
  ITrackingInfo,
  IResponse,
  IMemberProduct,
} from '@eatfit247-shared-lib';
import {
  IAddItemsPayload,
  ICreateDraftPayload,
  IBookShipmentPayload,
} from './models/shipment.model';

@Injectable({
  providedIn: 'root',
})
export class DeliveryApiService extends ApiBaseService {
  private readonly endpoint = '/delivery';
  private readonly memberEndpoint = '/member';

  constructor() {
    super();
  }

  async getShipmentDetails(id: number): Promise<IShipment> {
    const res = await this.httpService.get<IResponse<IShipment>>(
      `${this.endpoint}/shipments/${id}`
    );
    return res.data as IShipment;
  }

  /**
   * @deprecated Use getShipmentDetails(id) with shipmentId from order.shipments. New flow uses memberProductId.
   */
  async getShipmentByOrderId(orderId: number): Promise<IShipment | null> {
    try {
      const res = await this.httpService.get<IResponse<ITableList<IShipment>>>(
        `${this.endpoint}/shipments/list`,
        { params: <IBasicSearch>{ ids: [orderId], limit: 1 } }
      );
      const tableList = res.data as ITableList<IShipment> | undefined;
      if (!tableList || !Array.isArray(tableList.tableData)) {
        return null;
      }
      const shipments = tableList.tableData;
      return shipments.length > 0 ? shipments[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * @deprecated Use createDraft({ memberProductId, items }) instead. New flow uses member product orders.
   */
  async createShipmentForOrder(orderId: number): Promise<IShipment> {
    const res = await this.httpService.post<IResponse<IShipment>>(
      `${this.endpoint}/shipments`,
      { orderId }
    );
    return res.data as IShipment;
  }

  async createDraft(payload: ICreateDraftPayload): Promise<IShipment> {
    const res = await this.httpService.post<IResponse<IShipment>>(
      `${this.endpoint}/create-draft`,
      payload
    );
    return res.data as IShipment;
  }

  async addItems(id: number, payload: IAddItemsPayload): Promise<IShipment> {
    const res = await this.httpService.post<IResponse<IShipment>>(
      `${this.endpoint}/${id}/items`,
      payload
    );
    return res.data as IShipment;
  }

  async getRates(id: number): Promise<IRateQuote[]> {
    const res = await this.httpService.post<IResponse<IRateQuote[]>>(
      `${this.endpoint}/${id}/rates`,
      {}
    );
    return res.data as IRateQuote[];
  }

  /**
   * @deprecated Use bookShipment(id, { rateQuoteId }) instead. Book endpoint selects rate when rateQuoteId is provided.
   */
  async selectRate(id: number, rateQuoteId: number): Promise<IShipment> {
    const res = await this.httpService.post<IResponse<IShipment>>(
      `${this.endpoint}/${id}/select-rate`,
      { rateQuoteId }
    );
    return res.data as IShipment;
  }

  async bookShipment(
    id: number,
    payload?: IBookShipmentPayload
  ): Promise<IShipment> {
    const res = await this.httpService.post<IResponse<IShipment>>(
      `${this.endpoint}/${id}/book`,
      payload ?? {}
    );
    return res.data as IShipment;
  }

  async getTracking(id: number): Promise<ITrackingInfo> {
    const res = await this.httpService.get<IResponse<ITrackingInfo>>(
      `${this.endpoint}/${id}/tracking`
    );
    return res.data as ITrackingInfo;
  }

  async retryBooking(
    id: number,
    payload?: IBookShipmentPayload
  ): Promise<IShipment> {
    const res = await this.httpService.post<IResponse<IShipment>>(
      `${this.endpoint}/${id}/book`,
      payload ?? {}
    );
    return res.data as IShipment;
  }

  async getProductOrder(
    memberId: number,
    memberProductId: number
  ): Promise<IMemberProduct> {
    const res = await this.httpService.get<IResponse<IMemberProduct>>(
      `${this.memberEndpoint}/${memberId}/product/${memberProductId}`
    );
    return res.data as IMemberProduct;
  }
}

