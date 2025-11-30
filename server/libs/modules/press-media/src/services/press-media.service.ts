import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnPressMedia } from '../models';
import { ITableList, IBasicSearch, IPressMedia, IManagePressMedia } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';

@Injectable()
export class PressMediaService {
  constructor(
    @InjectModel(TxnPressMedia) private readonly pressMediaRepository: typeof TxnPressMedia,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IPressMedia>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.pressMediaRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IPressMedia[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      data: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IPressMedia {
    return <IPressMedia>{
      pressMediaId: item.pressMediaId,
      id: item.pressMediaId,
      title: item.title,
      type: item.type as 'youtube' | 'press',
      link: item.link,
      active: item.active,
      imagePath: CommonFunctionsUtil.getImagesObj(item.imagePath),
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  public async fetchById(id: number): Promise<IPressMedia> {
    const find = await this.pressMediaRepository.scope('details').findOne({
      where: { pressMediaId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Press media not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManagePressMedia, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      title: obj.title || null,
      type: obj.type,
      link: obj.link,
      active: obj.active,
      imagePath: (obj.uploadFiles && obj.uploadFiles.length > 0) ? JSON.stringify(obj.uploadFiles) : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.create(createObj);
  }

  public async update(id: number, obj: IManagePressMedia, cIp: string, adminId: number): Promise<void> {
    const find = await this.pressMediaRepository.findOne({
      where: { pressMediaId: id },
    });
    if (!find) {
      throw new NotFoundException('Press media not found');
    }
    const updateObj = {
      title: obj.title || null,
      type: obj.type,
      link: obj.link,
      active: obj.active,
      imagePath: (obj.uploadFiles && obj.uploadFiles.length > 0) ? JSON.stringify(obj.uploadFiles) : null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.update(updateObj, { where: { pressMediaId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.pressMediaRepository.findOne({
      where: { pressMediaId: id },
    });
    if (!find) {
      throw new NotFoundException('Press media not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.pressMediaRepository.update(updateObj, { where: { pressMediaId: id } });
  }
}

