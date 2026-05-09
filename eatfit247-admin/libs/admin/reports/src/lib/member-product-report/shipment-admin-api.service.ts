import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import { IShipment, ITrackingInfo } from '@eatfit247-shared-lib';

export interface IShipmentManualRetryResult {
  shipmentId: number;
  shipmentNumber: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShipmentAdminApiService {
  private readonly httpService = inject(HttpService);
  async getShipment(shipmentId: number): Promise<IShipment> {
    const res = await this.httpService.get<IShipment>(`shipment/${shipmentId}`);
    return res.data as IShipment;
  }

  async trackShipment(shipmentId: number): Promise<ITrackingInfo> {
    const res = await this.httpService.get<ITrackingInfo>(`shipment/${shipmentId}/track`);
    return res.data as ITrackingInfo;
  }

  async retryShipment(shipmentId: number): Promise<IShipmentManualRetryResult> {
    const res = await this.httpService.post<IShipmentManualRetryResult>(
      `shipment/${shipmentId}/retry`,
      {},
    );
    return res.data as IShipmentManualRetryResult;
  }

  async createShipmentForMemberProductOrder(memberProductId: number): Promise<void> {
    await this.httpService.post(`shipment/${memberProductId}`, {});
  }
}
