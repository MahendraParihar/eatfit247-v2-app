import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { MemberProductService, TxnMember, TxnMemberProduct } from '@server_1/modules/member';
import {
  BusinessTypeEnum,
  IMemberProductReportItem,
  IMemberProductReportShipment,
  ITableList,
} from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { MstCourierProvider, TxnShipment } from '@server_1/modules/delivery';
import { MemberProductReportDto } from '../dto';
import archiver from 'archiver';
import moment from 'moment/moment';

@Injectable()
export class MemberProductReportService {
  private readonly logger = new Logger(MemberProductReportService.name);

  constructor(
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct,
    @InjectModel(TxnShipment)
    private readonly shipmentRepository: typeof TxnShipment,
    private readonly memberProductService: MemberProductService,
  ) {}

  private applyShipmentFilters(whereCondition: Record<string, unknown>, dto: MemberProductReportDto): void {
    const sequelize = this.memberProductRepository.sequelize;
    if (dto.hasShipment === false) {
      (whereCondition as any).memberProductId = {
        [Op.notIn]: Sequelize.literal('(SELECT order_id FROM public.txn_shipments)'),
      };
    } else if (dto.hasShipment === true || dto.shipmentStatus) {
      let subQuery = '(SELECT order_id FROM public.txn_shipments';
      if (dto.shipmentStatus) {
        subQuery += ` WHERE status = ${sequelize.escape(dto.shipmentStatus)}`;
      }
      subQuery += ')';
      (whereCondition as any).memberProductId = {
        [Op.in]: Sequelize.literal(subQuery),
      };
    }
  }

  private mapReportShipment(raw: Record<string, unknown> | null | undefined): IMemberProductReportShipment | null {
    if (!raw) {
      return null;
    }
    const s = raw as any;
    const courier = s.courierProvider;
    return {
      shipmentId: s.shipmentId,
      orderId: s.orderId,
      shipmentNumber: s.shipmentNumber,
      status: s.status,
      lastKnownStatus: s.lastKnownStatus ?? null,
      trackingNumber: s.trackingNumber ?? null,
      trackingUrl: s.trackingUrl ?? null,
      receiverName: s.receiverName ?? null,
      receiverCity: s.receiverCity ?? null,
      receiverState: s.receiverState ?? null,
      receiverPincode: s.receiverPincode ?? null,
      providerName: courier?.providerName,
      lastError: s.lastError ?? null,
      retryCount: s.retryCount ?? 0,
    };
  }

  /**
   * Get member product order report based on date range and filters
   * @param dto - Member product report filter DTO
   * @returns List of product orders with member and franchise information
   */
  async getMemberProductReport(
    dto: MemberProductReportDto,
  ): Promise<ITableList<IMemberProductReportItem>> {
    const startDateStr = moment(dto.startDate).startOf('day').utc().startOf('day');
    const endDateStr = moment(dto.endDate).endOf('day').utc().endOf('day');
    const whereCondition: any = {
      active: true,
      paymentDate: {
        [Op.and]: {
          [Op.gte]: startDateStr.format(),
          [Op.lte]: endDateStr.format(),
        },
      },
    };

    if (dto.paymentStatusId) {
      whereCondition.paymentStatusId = dto.paymentStatusId;
    }
    if (dto.franchiseId) {
      whereCondition.franchiseId = dto.franchiseId;
    }

    this.applyShipmentFilters(whereCondition, dto);

    const { rows, count } = await this.memberProductRepository.scope('list').findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: true,
          attributes: [
            'memberId',
            'firstName',
            'lastName',
            'emailId',
            'contactNumber',
            'franchiseId',
          ],
        },
      ],
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });

    if (rows.length === 0) {
      return { tableData: [], count: 0 };
    }

    // Fetch shipment for each returned order (separate query — TxnShipment is in delivery lib)
    const orderIds = rows.map((item: any) => item.memberProductId);
    const shipments = await this.shipmentRepository.findAll({
      where: { orderId: { [Op.in]: orderIds } },
      attributes: [
        'shipmentId',
        'orderId',
        'shipmentNumber',
        'status',
        'lastKnownStatus',
        'trackingNumber',
        'trackingUrl',
        'receiverName',
        'receiverCity',
        'receiverState',
        'receiverPincode',
        'lastError',
        'retryCount',
      ],
      include: [
        {
          model: MstCourierProvider,
          as: 'courierProvider',
          required: false,
          attributes: ['courierProviderId', 'providerCode', 'providerName'],
        },
      ],
      raw: true,
      nest: true,
    });

    // orderId → shipment lookup map
    const shipmentMap: Record<number, any> = {};
    shipments.forEach((s: any) => {
      shipmentMap[s.orderId] = s;
    });

    const tableData = rows.map((item: any) => {
      const productOrder = (this.memberProductService as any).convertToModel(item);
      return {
        ...productOrder,
        franchiseName: item.member?.franchise?.companyName || 'N/A',
        memberEmail: item.member?.emailId || '',
        memberContactNumber: item.member?.contactNumber || '',
        shipment: this.mapReportShipment(shipmentMap[item.memberProductId]),
      };
    });

    return { tableData, count };
  }

  /**
   * Export member product reports as zip file containing all invoices
   * @param dto - Member product report filter DTO
   * @returns Stream of zip file
   */
  async exportMemberProductReports(dto: MemberProductReportDto): Promise<archiver.Archiver> {
    const startDateStr = moment(dto.startDate).startOf('day').utc().startOf('day');
    const endDateStr = moment(dto.endDate).endOf('day').utc().endOf('day');
    const whereCondition: any = {
      active: true,
      paymentDate: {
        [Op.and]: {
          [Op.gte]: startDateStr.format(),
          [Op.lte]: endDateStr.format(),
        },
      },
    };
    if (dto.paymentStatusId) {
      whereCondition.paymentStatusId = dto.paymentStatusId;
    }
    this.applyShipmentFilters(whereCondition, dto);
    // Build member where condition
    const memberWhereCondition: any = {};
    if (dto.franchiseId) {
      memberWhereCondition.franchiseId = dto.franchiseId;
    }
    // Build include conditions
    const includeConditions: any[] = [
      {
        model: TxnMember,
        as: 'member',
        required: true,
        where: Object.keys(memberWhereCondition).length > 0 ? memberWhereCondition : undefined,
        attributes: [
          'memberId',
          'firstName',
          'lastName',
          'emailId',
          'contactNumber',
          'franchiseId',
        ],
        include: [
          {
            model: MstFranchise,
            as: 'franchise',
            required: true,
            attributes: ['franchiseId', 'companyName'],
            where: {
              active: true,
              [Op.and]: [
                Sequelize.literal(
                  `'${BusinessTypeEnum.PRODUCT}'::public.business_type = ANY("business_type")`,
                ),
              ],
            },
          },
        ],
      },
    ];
    // Fetch all product orders (no pagination for export)
    const productOrders = await this.memberProductRepository.scope('list').findAll({
      where: whereCondition,
      include: includeConditions,
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });
    // Generate invoices for each product order and add to zip
    const invoicePromises = productOrders.map(async (item: any) => {
      try {
        const productOrder = (this.memberProductService as any).convertToModel(item);
        const memberId = productOrder.memberId;
        const productId = productOrder.memberProductId;
        // Generate invoice PDF
        const invoiceFile = await this.memberProductService.generateInvoicePDF(memberId, productId);
        // Convert base64 buffer to Buffer
        const pdfBuffer = Buffer.from(invoiceFile.buffer, 'base64');
        // Add to zip with a clean filename
        const memberName = `${productOrder.memberName || 'Member'}_${memberId}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        );
        const fileName = `Product_Invoice_${memberName}_${productId}.pdf`;
        archive.append(pdfBuffer, { name: fileName });
      } catch (error) {
        this.logger.error(`Failed to generate invoice for product order ${item.memberProductId}`, {
          error,
        });
        // Continue with other invoices even if one fails
      }
    });
    // Wait for all invoices to be added to the archive
    await Promise.all(invoicePromises);
    // Finalize the archive
    await archive.finalize();
    return archive;
  }

  /**
   * Export selected member product reports as zip file containing invoices for specific IDs
   * @param memberProductIds - Array of member product IDs to export
   * @returns Stream of zip file
   */
  async exportMemberProductReportsBulk(memberProductIds: number[]): Promise<archiver.Archiver> {
    if (!memberProductIds || memberProductIds.length === 0) {
      throw new Error('At least one member product ID is required');
    }
    // Build where condition to fetch only selected product orders
    const whereCondition: any = {
      active: true,
      memberProductId: {
        [Op.in]: memberProductIds,
      },
    };
    // Build include conditions
    const includeConditions: any[] = [
      {
        model: TxnMember,
        as: 'member',
        required: true,
        attributes: [
          'memberId',
          'firstName',
          'lastName',
          'emailId',
          'contactNumber',
          'franchiseId',
        ],
        include: [
          {
            model: MstFranchise,
            as: 'franchise',
            required: true,
            attributes: ['franchiseId', 'companyName'],
            where: {
              active: true,
              [Op.and]: [
                Sequelize.literal(
                  `'${BusinessTypeEnum.PRODUCT}'::public.business_type = ANY("business_type")`,
                ),
              ],
            },
          },
        ],
      },
    ];
    // Fetch selected product orders
    const productOrders = await this.memberProductRepository.scope('list').findAll({
      where: whereCondition,
      include: includeConditions,
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });
    // Generate invoices for each product order and add to zip
    const invoicePromises = productOrders.map(async (item: any) => {
      try {
        const productOrder = (this.memberProductService as any).convertToModel(item);
        const memberId = productOrder.memberId;
        const productId = productOrder.memberProductId;
        // Generate invoice PDF
        const invoiceFile = await this.memberProductService.generateInvoicePDF(memberId, productId);
        // Convert base64 buffer to Buffer
        const pdfBuffer = Buffer.from(invoiceFile.buffer, 'base64');
        // Add to zip with a clean filename
        const memberName = `${productOrder.memberName || 'Member'}_${memberId}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        );
        const fileName = `Product_Invoice_${memberName}_${productId}.pdf`;
        archive.append(pdfBuffer, { name: fileName });
      } catch (error) {
        this.logger.error(`Failed to generate invoice for product order ${item.memberProductId}`, {
          error,
        });
        // Continue with other invoices even if one fails
      }
    });
    // Wait for all invoices to be added to the archive
    await Promise.all(invoicePromises);
    // Finalize the archive
    await archive.finalize();
    return archive;
  }
}
