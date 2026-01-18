import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProduct } from '../models';
import {
  IBasicSearch, IDropdownItem,
  IManageProduct,
  IProduct,
  IPublicProduct,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(MstProduct)
    private readonly productRepository: typeof MstProduct,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProduct>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.productRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IProduct[] = rows.map((item: any) => {
      return this.convertToModel(item);
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  public async findAllPublic(searchDto: IBasicSearch): Promise<IPublicTableList<IPublicProduct>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    whereCondition.active = true; // Only active products for public
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.productRepository.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IPublicProduct[] = rows.map((item: any) => {
      return this.convertToPublic(this.convertToModel(item));
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  public async findBySlug(slug: string): Promise<IPublicProduct> {
    // Note: slug is not in the new mst_product table structure
    // This method is kept for backward compatibility but may need to be updated
    // to use productId or name instead
    throw new NotFoundException('Product lookup by slug is not supported in the new schema');
  }

  private convertToModel(item: any): IProduct {
    const imagePath = item.imagePath ? CommonFunctionsUtil.buildImageUrl(item.imagePath) : [];
    return <IProduct>{
      productId: item.productId,
      name: item.name,
      imagePath: imagePath,
      fees: item.fees || [],
      additionalInfo: item.additionalInfo || {},
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdIp: item.createdIp,
      modifiedIp: item.modifiedIp,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  /**
   * Convert IProduct to IPublicProduct by omitting internal/admin fields
   */
  private convertToPublic(product: IProduct): IPublicProduct {
    const {
      createdBy,
      modifiedBy,
      createdAt,
      updatedAt,
      active,
      createdByUser,
      updatedByUser,
      ...publicProduct
    } = product;
    return publicProduct as IPublicProduct;
  }

  public async fetchById(id: number): Promise<IProduct> {
    const find = await this.productRepository.scope('details').findOne({
      where: { productId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Product not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageProduct, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      name: obj.name,
      imagePath: obj.imagePath || [],
      fees: obj.fees || [],
      additionalInfo: obj.additionalInfo || {},
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.productRepository.create(createObj);
  }

  public async update(
    id: number,
    obj: IManageProduct,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.productRepository.findOne({
      where: { productId: id },
    });
    if (!find) {
      throw new NotFoundException('Product not found');
    }
    const updateObj = {
      name: obj.name,
      imagePath: obj.imagePath || [],
      fees: obj.fees || [],
      additionalInfo: obj.additionalInfo || {},
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.productRepository.update(updateObj, {
      where: { productId: id },
    });
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.productRepository.findOne({
      where: { productId: id },
    });
    if (!find) {
      throw new NotFoundException('Product not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.productRepository.update(updateObj, {
      where: { productId: id },
    });
  }

  public async getProductList(): Promise<IProduct[]> {
    return await this.productRepository.findAll({
      where: { active: true },
      order: [['createdAt', 'DESC']],
    });
  }
}

