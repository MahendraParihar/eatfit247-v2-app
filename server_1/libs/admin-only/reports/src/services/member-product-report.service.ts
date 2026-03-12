import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { MemberProductService, TxnMember, TxnMemberProduct } from '@server_1/modules/member';
import { BusinessTypeEnum, IMemberProductReportItem, ITableList } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { MemberProductReportDto } from '../dto/member-product-report.dto';
import archiver from 'archiver';
import moment from 'moment/moment';

@Injectable()
export class MemberProductReportService {
  private readonly logger = new Logger(MemberProductReportService.name);

  constructor(
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct,
    @InjectModel(TxnMember)
    private readonly memberRepository: typeof TxnMember,
    private readonly memberProductService: MemberProductService,
  ) {}

  /**
   * Get member product order report based on date range and filters
   * @param dto - Member product report filter DTO
   * @returns List of product orders with member and franchise information
   */
  async getMemberProductReport(dto: MemberProductReportDto): Promise<ITableList<IMemberProductReportItem>> {
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
    // Add a payment status filter if provided
    if (dto.paymentStatusId) {
      whereCondition.paymentStatusId = dto.paymentStatusId;
    }
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
      },
    ];
    const { rows, count } = await this.memberProductRepository.scope('list').findAndCountAll({
      where: whereCondition,
      include: includeConditions,
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });
    // Convert to model and add additional fields
    const tableData = rows.map((item: any) => {
      const productOrder = (this.memberProductService as any).convertToModel(item);
      return {
        ...productOrder,
        franchiseName: item.member?.franchise?.companyName || 'N/A',
        memberEmail: item.member?.emailId || '',
        memberContactNumber: item.member?.contactNumber || '',
      };
    });
    return {
      tableData,
      count,
    };
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
    // Add payment status filter if provided
    if (dto.paymentStatusId) {
      whereCondition.paymentStatusId = dto.paymentStatusId;
    }
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
                Sequelize.literal(`'${BusinessTypeEnum.PRODUCT}'::public.business_type = ANY("business_type")`),
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
        const memberName = `${productOrder.memberName || 'Member'}_${memberId}`.replace(/[^a-zA-Z0-9_]/g, '_');
        const fileName = `Product_Invoice_${memberName}_${productId}.pdf`;
        archive.append(pdfBuffer, { name: fileName });
      } catch (error) {
        this.logger.error(
          `Failed to generate invoice for product order ${item.memberProductId}`,
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
                Sequelize.literal(`'${BusinessTypeEnum.PRODUCT}'::public.business_type = ANY("business_type")`),
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
        const memberName = `${productOrder.memberName || 'Member'}_${memberId}`.replace(/[^a-zA-Z0-9_]/g, '_');
        const fileName = `Product_Invoice_${memberName}_${productId}.pdf`;
        archive.append(pdfBuffer, { name: fileName });
      } catch (error) {
        this.logger.error(
          `Failed to generate invoice for product order ${item.memberProductId}`,
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

