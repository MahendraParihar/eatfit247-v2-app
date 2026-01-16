import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnProduct } from '../models';
import {
  IBasicSearch,
  IManageProduct,
  IProduct,
  IPublicProduct,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(TxnProduct)
    private readonly productRepository: typeof TxnProduct,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(
    searchDto: IBasicSearch,
  ): Promise<ITableList<IProduct>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.productRepository
      .scope('list')
      .findAndCountAll({
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

  public async findAllPublic(
    searchDto: IBasicSearch,
  ): Promise<IPublicTableList<IPublicProduct>> {
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
    const find = await this.productRepository.findOne({
      where: { slug, active: true },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Product not found');
    }
    return this.convertToPublic(this.convertToModel(find));
  }

  private convertToModel(item: any): IProduct {
    return <IProduct>{
      productId: item.productId,
      id: item.productId,
      name: item.name,
      slug: item.slug,
      description: item.description,
      priceRange: {
        min: item.priceRangeMin,
        max: item.priceRangeMax,
      },
      sizes: item.sizes,
      benefits: item.benefits,
      dose: item.dose,
      howToTake: item.howToTake,
      precautions: item.precautions,
      ingredients: item.ingredients,
      consumptionInstructions: item.consumptionInstructions,
      outcomes: item.outcomes,
      faqs: item.faqs,
      images: item.images
        ? CommonFunctionsUtil.buildImageUrl(item.images)
        : undefined,
      videos: item.videos,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
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
      updatedBy,
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

  public async create(
    obj: IManageProduct,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const createObj = {
      name: obj.name,
      slug: obj.slug,
      description: obj.description || null,
      priceRangeMin: obj.priceRange.min,
      priceRangeMax: obj.priceRange.max,
      sizes: obj.sizes,
      benefits: obj.benefits,
      dose: obj.dose,
      howToTake: obj.howToTake,
      precautions: obj.precautions,
      ingredients: obj.ingredients,
      consumptionInstructions: obj.consumptionInstructions,
      outcomes: obj.outcomes,
      faqs: obj.faqs,
      images: obj.images && obj.images.length > 0 ? obj.images : null,
      videos: obj.videos && obj.videos.length > 0 ? obj.videos : null,
      active: obj.active,
      createdBy: adminId,
      updatedBy: adminId,
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
      slug: obj.slug,
      description: obj.description || null,
      priceRangeMin: obj.priceRange.min,
      priceRangeMax: obj.priceRange.max,
      sizes: obj.sizes,
      benefits: obj.benefits,
      dose: obj.dose,
      howToTake: obj.howToTake,
      precautions: obj.precautions,
      ingredients: obj.ingredients,
      consumptionInstructions: obj.consumptionInstructions,
      outcomes: obj.outcomes,
      faqs: obj.faqs,
      images: obj.images && obj.images.length > 0 ? obj.images : null,
      videos: obj.videos && obj.videos.length > 0 ? obj.videos : null,
      active: obj.active,
      updatedBy: adminId,
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
      updatedBy: adminId,
      modifiedIp: cIp,
    };
    await this.productRepository.update(updateObj, {
      where: { productId: id },
    });
  }
}

