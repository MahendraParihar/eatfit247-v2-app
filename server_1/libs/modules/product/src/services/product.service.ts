import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { MstProduct, MstProductPrice, MstProductVariant } from "../models";
import {
  IBasicSearch,
  IManageProduct,
  IProduct,
  IPublicProduct,
  IPublicTableList,
  ITableList
} from "@eatfit247-shared-lib";
import { CommonFunctionsUtil, SearchUtil } from "@server_1/core";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(MstProduct)
    private readonly productRepository: typeof MstProduct,
    @InjectModel(MstProductVariant)
    private readonly productVariantRepository: typeof MstProductVariant,
    @InjectModel(MstProductPrice)
    private readonly productPriceRepository: typeof MstProductPrice
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProduct>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, "name");
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    // Don't include variants in list query to avoid duplicates - variants are not needed for listing
    const { rows, count } = await this.productRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IProduct[] = rows.map((item: any) => {
      return this.convertToModel(item);
    });
    return {
      tableData: resList,
      count: count
    };
  }

  public async findAllPublic(searchDto: IBasicSearch): Promise<IPublicTableList<IPublicProduct>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, "name");
    whereCondition.active = true; // Only active products for public
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.productRepository.findAndCountAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true
    });
    const resList: IPublicProduct[] = rows.map((item: any) => {
      return this.convertToPublic(this.convertToModel(item));
    });
    return {
      tableData: resList,
      count: count
    };
  }

  private convertToModel(item: MstProduct & { fees?: any[]; variants?: any[] }): IProduct {
    const imagePath = item.imagePath ? CommonFunctionsUtil.buildImageUrl(item.imagePath) : [];
    return <IProduct>{
      productId: item.productId,
      name: item.name,
      imagePath: imagePath,
      fees: item.fees || [],
      additionalInfo: item.additionalInfo || {},
      hsnCode: item.hsnCode,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdIp: item.createdIp,
      modifiedIp: item.modifiedIp,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
      variants: item.variants || []
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
    const find = await this.productRepository.scope("details").findOne({
      where: { productId: id },
      raw: false, // Use model instance to properly handle associations
    });
    if (!find) {
      throw new NotFoundException("Product not found");
    }
    
    // Use variants from the scope if available, otherwise load them separately
    let variants: MstProductVariant[] = [];
    if (find.variants && Array.isArray(find.variants) && find.variants.length > 0) {
      variants = find.variants;
    } else {
      // Load variants and prices separately if not included in scope
      variants = await this.productVariantRepository.findAll({
        where: { productId: id },
        include: [
          {
            model: MstProductPrice,
            required: false,
            as: "prices"
          }
        ],
        raw: false, // Use model instances to properly handle associations
      });
    }

    const fees: any[] = [];
    const variantPayload: any[] = [];

    for (const variant of variants) {
      // Get prices from the association
      const variantPrices: MstProductPrice[] = variant.prices || [];

      const mappedPrices = variantPrices.map((price) => {
        const feeEntry = {
          quantity: Number(variant.quantityValue),
          unit: variant.quantityUnit,
          currency: price.currency,
          price: Number(price.price),
          sku: variant.sku || undefined,
          active: price.active,
          validFrom: price.validFrom,
          validTo: price.validTo
        };
        fees.push(feeEntry);

        return {
          id: price.id,
          productVariantId: price.productVariantId,
          currency: price.currency,
          price: Number(price.price),
          active: price.active,
          validFrom: price.validFrom,
          validTo: price.validTo,
        };
      });

      variantPayload.push({
        productVariantId: variant.productVariantId,
        productId: variant.productId,
        quantityValue: Number(variant.quantityValue),
        quantityUnit: variant.quantityUnit,
        sku: variant.sku || undefined,
        prices: mappedPrices
      });
    }

    // Convert model instance to plain object for convertToModel
    // Sequelize model instances can be accessed like plain objects, but toJSON() ensures proper conversion
    const productData = find.toJSON ? find.toJSON() : find;
    return this.convertToModel({
      ...productData,
      fees,
      variants: variantPayload
    } as any);
  }

  public async create(obj: IManageProduct, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      name: obj.name,
      imagePath: obj.imagePath || [],
      additionalInfo: obj.additionalInfo || {},
      hsnCode: obj.hsnCode,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp
    };
    const product = await this.productRepository.create(createObj);
    // Transform variants or fees to the format needed for replaceProductVariantsAndPrices
    const fees = this.transformToFeesFormat(obj);
    await this.replaceProductVariantsAndPrices(product.productId, fees);
  }

  public async update(
    id: number,
    obj: IManageProduct,
    cIp: string,
    adminId: number
  ): Promise<void> {
    const find = await this.productRepository.findOne({
      where: { productId: id }
    });
    if (!find) {
      throw new NotFoundException("Product not found");
    }
    const updateObj = {
      name: obj.name,
      imagePath: obj.imagePath || [],
      additionalInfo: obj.additionalInfo || {},
      hsnCode: obj.hsnCode,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp
    };
    await this.productRepository.update(updateObj, {
      where: { productId: id }
    });
    // Transform variants or fees to the format needed for replaceProductVariantsAndPrices
    const fees = this.transformToFeesFormat(obj);
    await this.replaceProductVariantsAndPrices(id, fees);
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number
  ): Promise<void> {
    const find = await this.productRepository.findOne({
      where: { productId: id }
    });
    if (!find) {
      throw new NotFoundException("Product not found");
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp
    };
    await this.productRepository.update(updateObj, {
      where: { productId: id }
    });
  }

  public async getProductList(): Promise<IProduct[]> {
    const products = await this.productRepository.scope('list').findAll({
      where: { active: true },
      order: [["createdAt", "DESC"]],
      nest: true,
    });
    return products.map((item: any) => this.convertToModel(item));
  }

  /**
   * Transform IManageProduct variants or fees to the fees format needed by replaceProductVariantsAndPrices
   */
  private transformToFeesFormat(obj: IManageProduct): { quantity: number; unit: string; currency: string; price: number; isActive?: boolean; validFrom?: Date | string | null; validTo?: Date | string | null }[] {
    const fees: { quantity: number; unit: string; currency: string; price: number; isActive?: boolean; validFrom?: Date | string | null; validTo?: Date | string | null }[] = [];

    // If variants are provided, transform them to fees format
    if (obj.variants && obj.variants.length > 0) {
      for (const variant of obj.variants) {
        if (variant.prices && variant.prices.length > 0) {
          for (const price of variant.prices) {
            fees.push({
              quantity: variant.quantityValue,
              unit: variant.quantityUnit,
              currency: price.currency,
              price: price.price,
              isActive: price.active !== undefined ? price.active : true,
              validFrom: price.validFrom !== undefined ? price.validFrom : null,
              validTo: price.validTo !== undefined ? price.validTo : null,
            });
          }
        }
      }
    }
    // If fees are provided directly, use them
    else if (obj.fees && obj.fees.length > 0) {
      for (const fee of obj.fees) {
        fees.push({
          quantity: fee.quantity,
          unit: fee.unit,
          currency: fee.currency,
          price: fee.price,
          isActive: fee.isActive !== undefined ? fee.isActive : true,
          validFrom: fee.validFrom,
          validTo: fee.validTo
        });
      }
    }

    return fees;
  }

  /**
   * Helper to rebuild variants and prices for a product from the
   * existing fees payload (quantity/unit/currency/price).
   */
  private async replaceProductVariantsAndPrices(
    productId: number,
    fees: { quantity: number; unit: string; currency: string; price: number; isActive?: boolean; validFrom?: Date | string | null; validTo?: Date | string | null }[]
  ): Promise<void> {
    // Remove existing prices and variants for this product
    const existingVariants = await this.productVariantRepository.findAll({
      where: { productId }
    });
    const variantIds = existingVariants.map((v) => v.productVariantId);
    if (variantIds.length > 0) {
      await this.productPriceRepository.destroy({
        where: { productVariantId: variantIds }
      });
      await this.productVariantRepository.destroy({
        where: { productId }
      });
    }
    // Create new variants and prices from the provided fees
    // Group fees by quantity and unit to create variants
    const variantMap = new Map<string, { quantity: number; unit: string; prices: typeof fees }>();
    
    for (const fee of fees) {
      const key = `${fee.quantity}_${fee.unit}`;
      if (!variantMap.has(key)) {
        variantMap.set(key, {
          quantity: fee.quantity,
          unit: fee.unit,
          prices: []
        });
      }
      variantMap.get(key)!.prices.push(fee);
    }

    // Create variants and their prices
    for (const [key, variantData] of variantMap) {
      const variant = await this.productVariantRepository.create({
        productId,
        quantityValue: variantData.quantity,
        quantityUnit: variantData.unit
      });

      // Create prices for this variant
      for (const priceData of variantData.prices) {
        await this.productPriceRepository.create({
          productVariantId: variant.productVariantId,
          currency: priceData.currency,
          price: priceData.price,
          active: priceData.isActive !== undefined ? priceData.isActive : true,
          validFrom: priceData.validFrom
            ? typeof priceData.validFrom === 'string'
              ? new Date(priceData.validFrom)
              : priceData.validFrom
            : null,
          validTo: priceData.validTo
            ? typeof priceData.validTo === 'string'
              ? new Date(priceData.validTo)
              : priceData.validTo
            : null,
        });
      }
    }
  }
}

