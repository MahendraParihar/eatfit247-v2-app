import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { MemberPlanService, TxnMember, TxnMemberPayment } from '@server_1/modules/member';
import { BusinessTypeEnum, IPaymentReportItem, ITableList } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { PaymentReportDto } from '../dto/payment-report.dto';
import archiver from 'archiver';
import moment from 'moment/moment';

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

    return {
      tableData,
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

    // Generate invoices for each payment and add to zip
    const invoicePromises = payments.map(async (item: any) => {
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
    });

    // Wait for all invoices to be added to the archive
    await Promise.all(invoicePromises);

    // Finalize the archive
    await archive.finalize();

    return archive;
  }
}

