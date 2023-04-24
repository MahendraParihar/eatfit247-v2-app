import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
  IS_DEV,
} from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment/moment';
import { MstReferrer } from '../../core/database/models/mst-referrer.model';
import { IReferrer } from '../../response-interface/referrer.interface';
import { CreateReferrerDto } from './dto/referrer.dto';
import { Sequelize } from 'sequelize-typescript';
import { CommonService } from '../common/common.service';
import { TableEnum } from '../../enums/table-enum';
import { AddressTypeEnum } from '../../enums/address-type-enum';
import { DropdownListInterface } from '../../response-interface/dropdown-list.interface';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class ReferrerService {
  constructor(
    @InjectModel(MstReferrer) private readonly referrerRepository: typeof MstReferrer,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.referrerRepository.findAndCountAll<MstReferrer>({
        include: [
          {
            model: MstAdminUser,
            required: false,
            as: 'CreatedBy',
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
          },
          {
            model: MstAdminUser,
            required: false,
            as: 'ModifiedBy',
            attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
          },
        ],
        where: whereCondition,
        order: [['name', 'ASC']],
        offset: offset,
        limit: pageSize,
        raw: true,
        nest: true,
      });
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

      const resList: IReferrer[] = [];
      for (const s of rows) {
        const iEvent: IReferrer = {
          id: s.referrerId,
          name: s.name,
          companyName: s.companyName,
          websiteLink: s.websiteLink,
          franchiseId: s.franchiseId,
          contactNumber: s.contactNumber,
          alternateContactNumber: s.alternateContactNumber,
          emailId: s.emailId,
          alternateEmailId: s.alternateEmailId,
          panNumber: s.panNumber,
          tanNumber: s.tanNumber,
          gstNumber: s.gstNumber,
          startDate: s.startDate ? moment(s.startDate, DB_DATE_FORMAT) : null,
          endDate: s.endDate ? moment(s.endDate, DB_DATE_FORMAT) : null,
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.logo),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
        };
        resList.push(iEvent);
      }

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: count,
        },
      };

      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.referrerRepository.findOne({
        where: {
          referrerId: id,
        },
        raw: true,
        nest: true,
      });
      if (find) {
        const dataObj = <IReferrer>{
          id: find.referrerId,
          name: find.name,
          companyName: find.companyName,
          websiteLink: find.websiteLink,
          franchiseId: find.franchiseId,
          contactNumber: find.contactNumber,
          alternateContactNumber: find.alternateContactNumber,
          emailId: find.emailId,
          alternateEmailId: find.alternateEmailId,
          panNumber: find.panNumber,
          tanNumber: find.tanNumber,
          gstNumber: find.gstNumber,
          startDate: find.startDate ? moment(find.startDate, DB_DATE_FORMAT) : null,
          endDate: find.endDate ? moment(find.endDate, DB_DATE_FORMAT) : null,
          active: find.active,
          imagePath: CommonFunctionsUtil.getImagesObj(find.logo),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
        };

        dataObj.addressObj = await this.commonService.findAddress(TableEnum.TXN_REFERRER, id);

        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: dataObj,
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateReferrerDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        name: obj.name,
        companyName: obj.companyName,
        websiteLink: obj.websiteLink,
        franchiseId: obj.franchiseId,
        contactNumber: obj.contactNumber,
        alternateContactNumber: obj.alternateContactNumber,
        emailId: obj.emailId,
        alternateEmailId: obj.alternateEmailId,
        panNumber: obj.panNumber,
        tanNumber: obj.tanNumber,
        gstNumber: obj.gstNumber,
        startDate: moment(obj.startDate),
        endDate: obj.endDate ? moment(obj.endDate) : null,
        logo: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);

      // create address
      const addObj = await this.commonService.addAddress({
        tableId: TableEnum.TXN_REFERRER,
        pkOfTable: createdObj['referrerId'],
        addressTypeId: obj.address.addressTypeId ? obj.address.addressTypeId : AddressTypeEnum.COMMUNICATION_ADDRESS,
        postalAddress: obj.address.postalAddress,
        pinCode: obj.address.pinCode,
        cityVillage: obj.address.cityVillage,
        stateId: obj.address.stateId,
        countryId: obj.address.countryId,
        latitude: obj.address.latitude,
        longitude: obj.address.longitude,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      });

      if (createdObj && addObj) {
        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateReferrerDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.referrerRepository.findOne({
        where: {
          referrerId: id,
        },
      });
      if (find) {
        const updateObj = {
          name: obj.name,
          companyName: obj.companyName,
          websiteLink: obj.websiteLink,
          franchiseId: obj.franchiseId,
          contactNumber: obj.contactNumber,
          alternateContactNumber: obj.alternateContactNumber,
          emailId: obj.emailId,
          alternateEmailId: obj.alternateEmailId,
          panNumber: obj.panNumber,
          tanNumber: obj.tanNumber,
          gstNumber: obj.gstNumber,
          startDate: obj.startDate ? moment(obj.startDate) : null,
          endDate: obj.endDate ? moment(obj.endDate) : null,
          logo: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
          active: obj.active != null ? obj.active : find.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);

        // update address
        const updateAddress = await this.commonService.updateAddressByTableNPkOfTable(TableEnum.TXN_REFERRER, id, {
          tableId: TableEnum.TXN_REFERRER,
          pkOfTable: id,
          addressTypeId: obj.address.addressTypeId ? obj.address.addressTypeId : AddressTypeEnum.COMMUNICATION_ADDRESS,
          postalAddress: obj.address.postalAddress,
          pinCode: obj.address.pinCode,
          cityVillage: obj.address.cityVillage,
          stateId: obj.address.stateId,
          countryId: obj.address.countryId,
          latitude: obj.address.latitude,
          longitude: obj.address.longitude,
          modifiedBy: adminId,
          modifiedIp: cIp,
        });

        if (updatedObj && updateAddress) {
          await t.commit();
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
            data: null,
          };
        } else {
          await t.rollback();
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();

      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.referrerRepository.findOne({
        where: {
          referrerId: id,
        },
      });
      if (find) {
        const updateObj = {
          active: obj.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchFranchiseBasedReferrer(franchiseId): Promise<DropdownListInterface[]> {
    const rows = await this.referrerRepository.findAll<MstReferrer>({
      order: [['companyName', 'ASC']],
      where: {
        franchiseId: franchiseId,
      },
      raw: true,
      nest: true,
    });
    const resList: DropdownListInterface[] = [];
    for (const s of rows) {
      const iEvent: DropdownListInterface = {
        id: s.referrerId,
        name: `${s.name} (${s.companyName})`,
        selected: false,
      };
      resList.push(iEvent);
    }
    return resList;
  }

  private async createInDB(obj: any) {
    return await this.referrerRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.referrerRepository
      .update(obj, { where: { referrerId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
