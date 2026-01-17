import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TxnContactForm, MstAdminUser } from '@server_1/core';
import { ITableList, IContactFormReportItem } from '@eatfit247-shared-lib';
import { ContactFormReportDto, SendContactFormResponseDto } from '../dto';

@Injectable()
export class ContactFormReportService {
  constructor(
    @InjectModel(TxnContactForm)
    private readonly contactFormRepository: typeof TxnContactForm,
  ) {}

  /**
   * Get contact form report based on date range and optional search filter
   * @param dto - Contact form report filter DTO
   * @returns List of contact forms with response information
   */
  async getContactFormReport(dto: ContactFormReportDto): Promise<ITableList<IContactFormReportItem>> {
    const whereCondition: any = {
      active: true,
      createdAt: {
        [Op.between]: [new Date(dto.startDate), new Date(dto.endDate)],
      },
    };

    // Add search condition if provided
    if (dto.search && dto.search.trim()) {
      const searchTerm = `%${dto.search.trim()}%`;
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { emailId: { [Op.iLike]: searchTerm } },
        { contactNumber: { [Op.iLike]: searchTerm } },
        { message: { [Op.iLike]: searchTerm } },
      ];
    }

    // Build include conditions
    const includeConditions: any[] = [
      {
        model: MstAdminUser,
        as: 'respondedByUser',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
    ];

    const { rows, count } = await this.contactFormRepository.scope('list').findAndCountAll({
      where: whereCondition,
      include: includeConditions,
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
    });

    // Transform data
    const tableData: IContactFormReportItem[] = rows.map((item: any) => {
      const respondedByUserName = item.respondedByUser
        ? `${item.respondedByUser.firstName || ''} ${item.respondedByUser.lastName || ''}`.trim() || null
        : null;

      return {
        contactFormId: item.contactFormId,
        name: item.name,
        emailId: item.emailId,
        countryCode: item.countryCode,
        contactNumber: item.contactNumber,
        fullContactNumber: `${item.countryCode} ${item.contactNumber}`,
        message: item.message,
        respondedBy: item.respondedBy || null,
        respondedByUserName,
        respondedMessage: item.respondedMessage || null,
        active: item.active,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        isResponded: !!item.respondedBy,
      };
    });

    return {
      tableData,
      count,
    };
  }

  /**
   * Get contact form details by ID
   * @param contactFormId - Contact form ID
   * @returns Contact form details with response information
   */
  async getContactFormDetails(contactFormId: number): Promise<IContactFormReportItem> {
    const contactForm = await this.contactFormRepository.scope('details').findOne({
      where: {
        contactFormId,
        active: true,
      },
      raw: true,
      nest: true,
    });

    if (!contactForm) {
      throw new NotFoundException('Contact form not found');
    }

    const item: any = contactForm;
    const respondedByUserName = item.respondedByUser
      ? `${item.respondedByUser.firstName || ''} ${item.respondedByUser.lastName || ''}`.trim() || null
      : null;

    return {
      contactFormId: item.contactFormId,
      name: item.name,
      emailId: item.emailId,
      countryCode: item.countryCode,
      contactNumber: item.contactNumber,
      fullContactNumber: `${item.countryCode} ${item.contactNumber}`,
      message: item.message,
      respondedBy: item.respondedBy || null,
      respondedByUserName,
      respondedMessage: item.respondedMessage || null,
      active: item.active,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isResponded: !!item.respondedBy,
    };
  }

  /**
   * Send response to contact form
   * @param contactFormId - Contact form ID
   * @param dto - Response DTO
   * @param adminId - Admin user ID
   * @param requestedIp - Request IP address
   */
  async sendResponse(
    contactFormId: number,
    dto: SendContactFormResponseDto,
    adminId: number,
    requestedIp: string,
  ): Promise<void> {
    const contactForm = await this.contactFormRepository.findOne({
      where: {
        contactFormId,
        active: true,
      },
    });

    if (!contactForm) {
      throw new NotFoundException('Contact form not found');
    }

    await this.contactFormRepository.update(
      {
        respondedMessage: dto.respondedMessage,
        respondedBy: adminId,
        modifiedIp: requestedIp,
      },
      {
        where: {
          contactFormId,
        },
      },
    );
  }
}

