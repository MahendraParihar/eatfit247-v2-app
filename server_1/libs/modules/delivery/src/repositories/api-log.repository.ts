import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnCourierApiLog } from '../models';

@Injectable()
export class ApiLogRepository {
  constructor(
    @InjectModel(TxnCourierApiLog)
    private readonly apiLogModel: typeof TxnCourierApiLog,
  ) {}

  async create(data: Partial<TxnCourierApiLog>): Promise<TxnCourierApiLog> {
    return this.apiLogModel.create(data as any);
  }

  async findByShipmentId(shipmentId: number): Promise<TxnCourierApiLog[]> {
    return this.apiLogModel.findAll({
      where: { shipmentId },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  }

  async findByProviderId(providerId: number, limit: number = 100): Promise<TxnCourierApiLog[]> {
    return this.apiLogModel.findAll({
      where: { providerId },
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  /**
   * Log successful API call
   */
  async logSuccess(data: {
    shipmentId?: number;
    providerId?: number;
    requestType: string;
    requestPayload?: Record<string, any>;
    responsePayload?: Record<string, any>;
    httpStatus?: number;
    responseTimeMs?: number;
  }): Promise<TxnCourierApiLog> {
    return this.apiLogModel.create({
      shipmentId: data.shipmentId,
      providerId: data.providerId,
      requestType: data.requestType,
      requestPayload: data.requestPayload,
      responsePayload: data.responsePayload,
      httpStatus: data.httpStatus || 200,
      responseTimeMs: data.responseTimeMs,
      errorMessage: null,
    } as any);
  }

  /**
   * Log failed API call
   */
  async logFailure(data: {
    shipmentId?: number;
    providerId?: number;
    requestType: string;
    requestPayload?: Record<string, any>;
    responsePayload?: Record<string, any>;
    httpStatus?: number;
    errorMessage: string;
    responseTimeMs?: number;
  }): Promise<TxnCourierApiLog> {
    return this.apiLogModel.create({
      shipmentId: data.shipmentId,
      providerId: data.providerId,
      requestType: data.requestType,
      requestPayload: data.requestPayload,
      responsePayload: data.responsePayload,
      httpStatus: data.httpStatus,
      errorMessage: data.errorMessage,
      responseTimeMs: data.responseTimeMs,
    } as any);
  }
}

