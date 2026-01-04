import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember } from '../models';
import { ConfigParam, IBasicSearch, IManageMember, IMember, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, CryptoUtil, generateRandomPassword } from '@server_1/core';
import { Op } from 'sequelize';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IMember>> {
    const whereCondition: any = {};
    if (searchDto.name) {
      whereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchDto.name}%` } },
        { lastName: { [Op.iLike]: `%${searchDto.name}%` } },
        { emailId: { [Op.iLike]: `%${searchDto.name}%` } },
      ];
    }
    if (searchDto.search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchDto.search}%` } },
        { lastName: { [Op.iLike]: `%${searchDto.search}%` } },
        { emailId: { [Op.iLike]: `%${searchDto.search}%` } },
        { contactNumber: { [Op.iLike]: `%${searchDto.search}%` } },
      ];
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.memberRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IMember[] = rows.map((item: TxnMember) => {
      return this.convertToModel(item);
    });
    return { tableData: resList, count: count };
  }

  private convertToModel(item: TxnMember): IMember {
    return <IMember>{
      memberId: item.memberId,
      id: item.memberId,
      firstName: item.firstName,
      lastName: item.lastName,
      profilePicture: CommonFunctionsUtil.buildImageUrl(item.profilePicture, this.appConfigService.getString(ConfigParam.CLIENT_URL)),
      countryCode: item.countryCode,
      contactNumber: item.contactNumber,
      emailId: item.emailId,
      hasAnyPlan: item.hasAnyPlan || false,
      referrerId: item.referrerId,
      referrer: item.referrer?.name || '',
      franchiseId: item.franchiseId,
      franchise: item.franchise?.companyName || '',
      countryId: item.countryId,
      country: item.country?.country || '',
      nutritionistId: item.nutritionistId,
      nutritionist: item.nutritionist
        ? `${item.nutritionist.firstName} ${item.nutritionist.lastName}`
        : '',
      active: item.active !== undefined ? item.active : true,
      deactivationReason: item.deactivationReason,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }

  public async fetchById(id: number): Promise<IMember> {
    const find = await this.memberRepository.scope('details').findOne({
      where: { memberId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Member not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageMember, cIp: string, adminId: number): Promise<void> {
    // Check if email already exists
    const existingMember = await this.memberRepository.findOne({
      where: { emailId: obj.emailId },
    });
    if (existingMember) {
      throw new BadRequestException('Email already exists');
    }
    // Hash password if provided
    let hashedPassword = '';
    if (obj.password) {
      hashedPassword = await CryptoUtil.generateHash(obj.password);
    } else {
      // Generate a temporary password if not provided
      const tempPassword = generateRandomPassword();
      hashedPassword = await CryptoUtil.generateHash(tempPassword);
    }
    const createObj = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      profilePicture:
        obj.profilePicture && obj.profilePicture.length > 0
          ? obj.profilePicture
          : null,
      password: hashedPassword,
      passwordTemp: hashedPassword, // Set the same as password initially
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      emailId: obj.emailId,
      franchiseId: obj.franchiseId,
      countryId: obj.countryId,
      referrerId: obj.referrerId || null,
      nutritionistId: obj.nutritionistId || null,
      active: obj.active !== undefined ? obj.active : true,
      deactivationReason: obj.deactivationReason || null,
      hasAnyPlan: obj.hasAnyPlan || false,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.memberRepository.create(createObj);
  }

  public async update(id: number, obj: IManageMember, cIp: string, adminId: number): Promise<void> {
    const find = await this.memberRepository.findOne({ where: { memberId: id } });
    if (!find) {
      throw new NotFoundException('Member not found');
    }
    // Check if email already exists for another member
    if (obj.emailId && obj.emailId !== find.emailId) {
      const existingMember = await this.memberRepository.findOne({
        where: { emailId: obj.emailId },
      });
      if (existingMember) {
        throw new BadRequestException('Email already exists');
      }
    }
    const updateObj: any = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      emailId: obj.emailId,
      franchiseId: obj.franchiseId,
      countryId: obj.countryId,
      referrerId: obj.referrerId || null,
      nutritionistId: obj.nutritionistId || null,
      active: obj.active !== undefined ? obj.active : true,
      deactivationReason: obj.deactivationReason || null,
      hasAnyPlan: obj.hasAnyPlan !== undefined ? obj.hasAnyPlan : find.hasAnyPlan,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    // Update password if provided
    if (obj.password) {
      const hashedPassword = await CryptoUtil.generateHash(obj.password);
      updateObj.password = hashedPassword;
      updateObj.passwordTemp = hashedPassword;
    }
    // Update setting picture if provided
    if (obj.profilePicture && obj.profilePicture.length > 0) {
      updateObj.profilePicture = obj.profilePicture;
    }
    await this.memberRepository.update(updateObj, { where: { memberId: id } });
  }

  public async changeStatus(
    id: number,
    active: boolean,
    deactivationReason: string | null,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.memberRepository.findOne({ where: { memberId: id } });
    if (!find) {
      throw new NotFoundException('Member not found');
    }
    const updateObj: {
      active: boolean;
      modifiedBy: number;
      modifiedIp: string;
      deactivationReason?: string;
    } = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    if (deactivationReason !== null && deactivationReason !== undefined) {
      updateObj.deactivationReason = deactivationReason;
    }
    await this.memberRepository.update(updateObj, { where: { memberId: id } });
  }
}

