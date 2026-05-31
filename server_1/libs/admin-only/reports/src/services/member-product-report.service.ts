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
import { MstFranchise, ReportSortUtil } from '@server_1/core';
import { MstPaymentStatus } from '@server_1/platform';
import { MstCourierProvider, TxnShipment } from '@server_1/modules/delivery';
import { MemberProductReportDto } from '../dto';
import archiver from 'archiver';
import moment from 'moment/moment';
import * as ExcelJS from 'exceljs';

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
      return;
    }
    if (dto.shipmentStatus) {
      // After a cancel + rebook there are multiple rows per order_id. The
      // user's mental model is "what's the *current* state of this order's
      // shipment", so filter against the latest row per order_id only.
      const subQuery =
        '(SELECT order_id FROM (' +
        'SELECT DISTINCT ON (order_id) order_id, status ' +
        'FROM public.txn_shipments ' +
        'ORDER BY order_id, created_at DESC' +
        ') latest WHERE status = ' +
        sequelize.escape(dto.shipmentStatus) +
        ')';
      (whereCondition as any).memberProductId = {
        [Op.in]: Sequelize.literal(subQuery),
      };
    } else if (dto.hasShipment === true) {
      (whereCondition as any).memberProductId = {
        [Op.in]: Sequelize.literal('(SELECT order_id FROM public.txn_shipments)'),
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

    // Fetch shipment for each returned order (separate query — TxnShipment is in delivery lib).
    // Order by createdAt DESC so that after a cancel+rebook (multiple rows per
    // orderId), the first row per order we see in the map-build below is the
    // most recent one — which is the one the dialog should drive actions on.
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
        'createdAt',
      ],
      include: [
        {
          model: MstCourierProvider,
          as: 'courierProvider',
          required: false,
          attributes: ['courierProviderId', 'providerCode', 'providerName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
    });

    // orderId → latest shipment lookup map (first-wins because list is sorted DESC)
    const shipmentMap: Record<number, any> = {};
    shipments.forEach((s: any) => {
      if (!(s.orderId in shipmentMap)) {
        shipmentMap[s.orderId] = s;
      }
    });

    const tableData = rows.map((item: any) => {
      const productOrder = (this.memberProductService as any).convertToModel(item, []);
      return {
        ...productOrder,
        franchiseName: item.member?.franchise?.companyName || 'N/A',
        memberEmail: item.member?.emailId || '',
        memberContactNumber: item.member?.contactNumber || '',
        shipment: this.mapReportShipment(shipmentMap[item.memberProductId]),
      };
    });

    const sorted = ReportSortUtil.sortInMemory(tableData, dto.sortBy, dto.sortOrder, {
      invoiceId: (r) => r.invoiceId ?? '',
      memberName: (r) => r.memberName,
      totalAmount: (r) => r.totalAmount,
      paymentStatus: (r) => r.paymentStatus,
      paymentDate: (r) => r.paymentDate,
      franchiseName: (r) => r.franchiseName ?? '',
    });

    return { tableData: sorted, count };
  }

  /**
   * Fetch product orders that don't yet have a shipment record.
   *
   * Independent of {@link MemberProductService.convertToModel} so the admin
   * can still see actionable orders (and create shipments) even if the main
   * report mapping regresses. Uses direct field projection.
   */
  async getPendingShipmentOrders(
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
      memberProductId: {
        [Op.notIn]: Sequelize.literal('(SELECT order_id FROM public.txn_shipments)'),
      },
    };
    if (dto.paymentStatusId) {
      whereCondition.paymentStatusId = dto.paymentStatusId;
    }
    if (dto.franchiseId) {
      whereCondition.franchiseId = dto.franchiseId;
    }

    const { rows, count } = await this.memberProductRepository.findAndCountAll({
      where: whereCondition,
      attributes: [
        'memberProductId',
        'memberId',
        'invoiceId',
        'paymentDate',
        'paymentStatusId',
        'subTotalAmount',
        'discountAmount',
        'taxAmount',
        'totalAmount',
        'currency',
        'franchiseId',
      ],
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: true,
          attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
          include: [
            {
              model: MstFranchise,
              as: 'franchise',
              required: false,
              attributes: ['franchiseId', 'companyName'],
            },
          ],
        },
        {
          model: MstPaymentStatus,
          as: 'paymentStatus',
          required: false,
          attributes: ['paymentStatusId', 'paymentStatus'],
        },
      ],
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });

    const tableData = rows.map((item: any) => ({
      memberProductId: item.memberProductId,
      memberId: item.memberId,
      memberName: `${item.member?.firstName || ''} ${item.member?.lastName || ''}`.trim(),
      memberEmail: item.member?.emailId || '',
      memberContactNumber: item.member?.contactNumber || '',
      invoiceId: item.invoiceId,
      paymentDate: item.paymentDate,
      paymentStatusId: item.paymentStatusId,
      paymentStatus: item.paymentStatus?.paymentStatus,
      subTotalAmount: Number(item.subTotalAmount) || 0,
      discountAmount: Number(item.discountAmount) || 0,
      taxAmount: Number(item.taxAmount) || 0,
      totalAmount: Number(item.totalAmount) || 0,
      currency: item.currency,
      franchiseId: item.franchiseId,
      franchise: item.member?.franchise?.companyName || 'N/A',
      franchiseName: item.member?.franchise?.companyName || 'N/A',
      shipment: null,
    })) as IMemberProductReportItem[];

    const sorted = ReportSortUtil.sortInMemory(tableData, dto.sortBy, dto.sortOrder, {
      invoiceId: (r) => r.invoiceId ?? '',
      memberName: (r) => r.memberName,
      totalAmount: (r) => r.totalAmount,
      paymentStatus: (r) => r.paymentStatus ?? '',
      paymentDate: (r) => r.paymentDate,
      franchiseName: (r) => r.franchiseName ?? '',
    });

    return { tableData: sorted, count };
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
    // Generate invoices in batches to avoid Puppeteer OOM
    const BATCH_SIZE = 3;
    for (let i = 0; i < productOrders.length; i += BATCH_SIZE) {
      const batch = productOrders.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item: any) => {
          try {
            const productOrder = (this.memberProductService as any).convertToModel(item, []);
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
        }),
      );
    }
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
    // Generate invoices in batches to avoid Puppeteer OOM
    const BATCH_SIZE = 3;
    for (let i = 0; i < productOrders.length; i += BATCH_SIZE) {
      const batch = productOrders.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item: any) => {
          try {
            const productOrder = (this.memberProductService as any).convertToModel(item, []);
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
        }),
      );
    }
    // Finalize the archive
    await archive.finalize();
    return archive;
  }

  /**
   * Export member product report as Excel file
   * @param dto - Member product report filter DTO
   * @returns ExcelJS workbook buffer
   */
  async exportMemberProductReportExcel(dto: MemberProductReportDto): Promise<Buffer> {
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

    const productOrders = await this.memberProductRepository.scope('list').findAll({
      where: whereCondition,
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: true,
          attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber', 'franchiseId'],
        },
      ],
      order: [['paymentDate', 'ASC']],
      raw: true,
      nest: true,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Member Product Report');

    sheet.columns = [
      { header: 'Invoice ID', key: 'invoiceId', width: 20 },
      { header: 'Payment Date', key: 'paymentDate', width: 15 },
      { header: 'Member Name', key: 'memberName', width: 22 },
      { header: 'Franchise', key: 'franchiseName', width: 25 },
      { header: 'Sub Total', key: 'subTotalAmount', width: 15 },
      { header: 'Discount', key: 'discountAmount', width: 12 },
      { header: 'Tax Amount', key: 'taxAmount', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 18 },
      { header: 'Payment Mode', key: 'paymentMode', width: 18 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'Country', key: 'country', width: 18 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    for (const item of productOrders as any[]) {
      const productOrder = (this.memberProductService as any).convertToModel(item, []);
      const memberAddress = productOrder.memberAddress || {};
      const billingAddress = memberAddress.billingAddress || {};

      sheet.addRow({
        invoiceId: productOrder.invoiceId || '',
        paymentDate: productOrder.paymentDate ? moment(productOrder.paymentDate).format('YYYY-MM-DD') : '',
        memberName: productOrder.memberName || '',
        franchiseName: productOrder.franchise || '',
        subTotalAmount: productOrder.subTotalAmount || 0,
        discountAmount: productOrder.discountAmount || 0,
        taxAmount: productOrder.taxAmount || 0,
        totalAmount: productOrder.totalAmount || 0,
        paymentStatus: productOrder.paymentStatus || '',
        paymentMode: productOrder.paymentMode || '',
        state: billingAddress.state || '',
        country: billingAddress.country || '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
