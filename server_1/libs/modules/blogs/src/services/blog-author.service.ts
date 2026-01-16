import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstBlogAuthor } from '../models';
import { IBasicSearch, IBlogAuthor, IManageBlogAuthor, IStatusChange, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class BlogAuthorService {
  constructor(
    @InjectModel(MstBlogAuthor) private readonly blogAuthorRepository: typeof MstBlogAuthor,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IBlogAuthor>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'firstName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.blogAuthorRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['firstName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IBlogAuthor {
    return <IBlogAuthor>{
      blogAuthorId: item.blogAuthorId,
      id: item.blogAuthorId,
      firstName: item.firstName,
      lastName: item.lastName,
      emailId: item.emailId,
      countryCode: item.countryCode,
      contactNumber: item.contactNumber,
      linkedUrl: item.linkedUrl,
      active: item.active,
      profilePicture: CommonFunctionsUtil.buildImageUrl(item.profilePicture),
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  public async fetchAll(): Promise<MstBlogAuthor[]> {
    return await this.blogAuthorRepository.scope('list').findAll({
      where: { active: true },
      order: [['firstName', 'ASC']],
      raw: true,
      nest: true,
    });
  }

  public async fetchById(id: number): Promise<IBlogAuthor> {
    const find = await this.blogAuthorRepository.scope('details').findOne({
      where: { blogAuthorId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Blog author not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageBlogAuthor, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      emailId: obj.emailId,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      linkedUrl: obj.linkedUrl,
      active: obj.active !== undefined ? obj.active : true,
      profilePicture: obj.profilePicture ? JSON.stringify(obj.profilePicture) : null,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.blogAuthorRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageBlogAuthor, requestedIp: string, userId: number): Promise<void> {
    const find = await this.blogAuthorRepository.findOne({ where: { blogAuthorId: id } });
    if (!find) {
      throw new NotFoundException('Blog author not found');
    }
    const dataObj: any = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      emailId: obj.emailId,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      linkedUrl: obj.linkedUrl,
      active: obj.active,
      profilePicture: obj.profilePicture ? JSON.stringify(obj.profilePicture) : null,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.blogAuthorRepository.update(dataObj, { where: { blogAuthorId: id } });
  }

  public async changeStatus(id: number, body: IStatusChange, requestedIp: string, userId: number): Promise<void> {
    const find = await this.blogAuthorRepository.findOne({ where: { blogAuthorId: id } });
    if (!find) {
      throw new NotFoundException('Blog author not found');
    }
    await this.blogAuthorRepository.update(
      {
        active: body.active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { blogAuthorId: id } },
    );
  }
}

