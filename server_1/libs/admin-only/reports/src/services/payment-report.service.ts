import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { MemberPlanService, TxnMember, TxnMemberPayment } from '@server_1/modules/member';
import { BusinessTypeEnum, IPaymentReportItem, ITableList } from '@eatfit247-shared-lib';
import { MstFranchise, ReportSortUtil } from '@server_1/core';
import { PaymentReportDto } from '../dto/payment-report.dto';
import archiver from 'archiver';
import moment from 'moment/moment';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PaymentReportService {
  private readonly logger = new Logger(PaymentReportService.name);

  constructor(
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMember)
    private readonly memberRepository: typeof TxnMember,
    private readonly memberPaymentService: MemberPlanService,
  ) {}

  /**
   * Get payment report based on date range and franchise filter
   * @param dto - Payment report filter DTO
   * @returns List of payments with member and franchise information
   */
  async getPaymentReport(dto: PaymentReportDto): Promise<ITableList<IPaymentReportItem>> {
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
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber', 'franchiseId'],
        include: [
          {
            model: MstFranchise,
            as: 'franchise',
            required: true,
            attributes: ['franchiseId', 'companyName'],
            where: {
              active: true,
              [Op.and]: [
                Sequelize.literal(`'${BusinessTypeEnum.SERVICE}'::public.business_type = ANY("business_type")`),
              ],
            },
          },
        ],
      },
    ];

    const { rows, count } = await this.memberPaymentRepository.scope('list').findAndCountAll({
      where: whereCondition,
      include: includeConditions,
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });

    // Convert to model and add franchise name
    // We need to use a workaround to access the private convertToModel method
    // by creating a similar conversion or accessing through reflection
    const tableData = rows.map((item: any) => {
      // Use the service's convertToModel through a public method or duplicate logic
      // For now, we'll create a simplified version
      const payment = (this.memberPaymentService as any).convertToModel(item);
      return {
        ...payment,
        franchiseName: item.member?.franchise?.companyName || 'N/A',
      };
    });

    const sorted = ReportSortUtil.sortInMemory(tableData, dto.sortBy, dto.sortOrder, {
      memberName: (r) => r.memberName,
      totalAmount: (r) => r.totalAmount,
      paymentDate: (r) => r.paymentDate,
      franchiseName: (r) => r.franchiseName,
    });

    return {
      tableData: sorted,
      count,
    };
  }

  /**
   * Export payment reports as zip file containing all invoices
   * @param dto - Payment report filter DTO
   * @returns Stream of zip file
   */
  async exportPaymentReports(dto: PaymentReportDto): Promise<archiver.Archiver> {
    const whereCondition: any = {
      active: true,
      paymentDate: {
        [Op.between]: [new Date(dto.startDate), new Date(dto.endDate)],
      },
    };

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
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber', 'franchiseId'],
        include: [
          {
            model: MstFranchise,
            as: 'franchise',
            required: true,
            attributes: ['franchiseId', 'companyName'],
            where: {
              active: true,
              [Op.and]: [
                Sequelize.literal(`'${BusinessTypeEnum.SERVICE}'::public.business_type = ANY("business_type")`),
              ],
            },
          },
        ],
      },
    ];

    // Fetch all payments (no pagination for export)
    const payments = await this.memberPaymentRepository.scope('list').findAll({
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

    // Generate invoices sequentially in batches to avoid Puppeteer OOM
    const BATCH_SIZE = 3;
    for (let i = 0; i < payments.length; i += BATCH_SIZE) {
      const batch = payments.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (item: any) => {
          try {
            const payment = (this.memberPaymentService as any).convertToModel(item);
            const memberId = payment.memberId;
            const paymentId = payment.memberPaymentId;

            // Generate invoice PDF
            const invoiceFile = await this.memberPaymentService.generateInvoicePDF(memberId, paymentId);

            // Convert base64 buffer to Buffer
            const pdfBuffer = Buffer.from(invoiceFile.buffer, 'base64');

            // Add to zip with a clean filename
            const memberName = `${payment.memberName || 'Member'}_${memberId}`.replace(/[^a-zA-Z0-9_]/g, '_');
            const fileName = `Invoice_${memberName}_${paymentId}.pdf`;
            archive.append(pdfBuffer, { name: fileName });
          } catch (error) {
            this.logger.error(
              `Failed to generate invoice for payment ${item.memberPaymentId}`,
              { error },
            );
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
   * Export payment report as Excel file
   * @param dto - Payment report filter DTO
   * @returns ExcelJS workbook buffer
   */
  async exportPaymentReportExcel(dto: PaymentReportDto): Promise<Buffer> {
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

    const memberWhereCondition: any = {};
    if (dto.franchiseId) {
      memberWhereCondition.franchiseId = dto.franchiseId;
    }

    const includeConditions: any[] = [
      {
        model: TxnMember,
        as: 'member',
        required: true,
        where: Object.keys(memberWhereCondition).length > 0 ? memberWhereCondition : undefined,
        attributes: ['memberId', 'firstName', 'lastName', 'franchiseId'],
        include: [
          {
            model: MstFranchise,
            as: 'franchise',
            required: true,
            attributes: ['franchiseId', 'companyName'],
            where: {
              active: true,
              [Op.and]: [
                Sequelize.literal(`'${BusinessTypeEnum.SERVICE}'::public.business_type = ANY("business_type")`),
              ],
            },
          },
        ],
      },
    ];

    const payments = await this.memberPaymentRepository.scope('list').findAll({
      where: whereCondition,
      include: includeConditions,
      order: [['paymentDate', 'ASC']],
      raw: true,
      nest: true,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payment Report');

    sheet.columns = [
      { header: 'Invoice ID', key: 'invoiceId', width: 20 },
      { header: 'Payment Date', key: 'paymentDate', width: 15 },
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Order Amount', key: 'orderAmount', width: 15 },
      { header: 'Tax Amount', key: 'taxAmount', width: 15 },
      { header: 'Tax %', key: 'taxPercentage', width: 10 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'CGST', key: 'cgst', width: 12 },
      { header: 'SGST', key: 'sgst', width: 12 },
      { header: 'IGST', key: 'igst', width: 12 },
      { header: 'Payment Mode', key: 'paymentMode', width: 18 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'Country', key: 'country', width: 18 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    for (const item of payments as any[]) {
      const payment = (this.memberPaymentService as any).convertToModel(item);
      const taxObj = payment.taxObj || {};
      const memberAddress = payment.memberAddress || {};
      const billingAddress = memberAddress.billingAddress || {};

      sheet.addRow({
        invoiceId: payment.invoiceId || '',
        paymentDate: payment.paymentDate ? moment(payment.paymentDate).format('YYYY-MM-DD') : '',
        firstName: item.member?.firstName || '',
        lastName: item.member?.lastName || '',
        companyName: item.member?.franchise?.companyName || '',
        orderAmount: payment.orderAmount || 0,
        taxAmount: payment.taxAmount || 0,
        taxPercentage: payment.taxPercentage || 0,
        totalAmount: payment.totalAmount || 0,
        cgst: taxObj.CGST?.amount != null ? Number(taxObj.CGST.amount) : 0,
        sgst: taxObj.SGST?.amount != null ? Number(taxObj.SGST.amount) : 0,
        igst: taxObj.IGST?.amount != null ? Number(taxObj.IGST.amount) : 0,
        paymentMode: payment.paymentMode || '',
        state: billingAddress.state || '',
        country: billingAddress.country || '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

