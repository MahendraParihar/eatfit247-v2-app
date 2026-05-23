import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  MstProduct,
  MstProductPrice,
  MstProductVariant,
} from '@server_1/models/product';
import {
  IBasicSearch,
  IManageProduct,
  IProduct,
  IProductFee,
  IProductPrice,
  IProductVariant,
  IPublicProduct,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(MstProduct)
    private readonly productRepository: typeof MstProduct,
    @InjectModel(MstProductVariant)
    private readonly productVariantRepository: typeof MstProductVariant,
    @InjectModel(MstProductPrice)
    private readonly productPriceRepository: typeof MstProductPrice,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProduct>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    // Don't include variants in list query to avoid duplicates - variants are not needed for listing
    const { rows, count } = await this.productRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set(['productId', 'name', 'active', 'createdAt', 'updatedAt']),
        [['createdAt', 'DESC']],
      ),
      offset: offset,
      limit: pageSize,
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
    // Load products with variants and prices
    const { rows, count } = await this.productRepository.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      offset: offset,
      limit: pageSize,
      include: [
        {
          model: MstProductVariant,
          as: 'variants',
          required: false,
          include: [
            {
              model: MstProductPrice,
              as: 'prices',
              required: false,
              where: { active: true }, // Only active prices for public
            },
          ],
        },
      ],
      raw: false, // Use model instances to properly handle associations
      nest: true,
    });
    // Process each product to load variants and prices
    const resList: IPublicProduct[] = await Promise.all(
      rows.map(async (item: MstProduct) => {
        // Get product data
        const productData = item.toJSON ? item.toJSON() : item;
        // Load variants and prices - check if already loaded via include
        let variants: MstProductVariant[] = [];
        if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
          // Variants already loaded via include
          variants = item.variants;
        } else {
          // Load variants and prices separately if not included
          variants = await this.productVariantRepository.findAll({
            where: { productId: item.productId },
            include: [
              {
                model: MstProductPrice,
                required: false,
                as: 'prices',
                where: { active: true }, // Only active prices for public
              },
            ],
            raw: false,
          });
        }
        // Transform variants to the format needed
        const fees: any[] = [];
        const variantPayload: any[] = [];
        for (const variant of variants) {
          const variantPrices: MstProductPrice[] = variant.prices || [];
          const mappedPrices = variantPrices
            .filter((price) => price.active !== false) // Only active prices
            .map((price) => {
              const feeEntry = {
                quantity: Number(variant.quantityValue),
                unit: variant.quantityUnit,
                currency: price.currency,
                price: Number(price.price),
                sku: variant.sku || undefined,
                isActive: price.active,
                validFrom: price.validFrom,
                validTo: price.validTo,
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
            prices: mappedPrices,
          });
        }
        // Convert to model with variants and fees
        const product = this.convertToModel({
          ...productData,
          fees,
          variants: variantPayload,
        } as any);
        return this.convertToPublic(product);
      }),
    );
    return {
      tableData: resList,
      count: count,
    };
  }

  public async findPublicProduct(
    productId: number,
    productVariantId: number,
  ): Promise<IPublicProduct> {
    const rows = await this.productRepository.findOne({
      where: { productId: productId },
      include: [
        {
          model: MstProductVariant,
          as: 'variants',
          required: false,
          where: {
            productVariantId: productVariantId,
          },
          include: [
            {
              model: MstProductPrice,
              as: 'prices',
              required: false,
              where: { active: true }, // Only active prices for public
            },
          ],
        },
      ],
      raw: false, // Use model instances to properly handle associations
      nest: true,
    });
    if (!rows) {
      throw new NotFoundException('Product not found');
    }
    // Process each product to load variants and prices
    const resList: IPublicProduct[] = [rows].map((item: MstProduct) => {
      // Get product data
      const productData = item.toJSON ? item.toJSON() : item;
      // Load variants and prices - check if already loaded via include
      let variants: MstProductVariant[] = [];
      // Variants already loaded via include
      variants = item.variants;
      // Transform variants to the format needed
      const fees: any[] = [];
      const variantPayload: any[] = [];
      for (const variant of variants) {
        const variantPrices: MstProductPrice[] = variant.prices || [];
        const mappedPrices = variantPrices
          .filter((price) => price.active !== false) // Only active prices
          .map((price) => {
            const feeEntry = {
              quantity: Number(variant.quantityValue),
              unit: variant.quantityUnit,
              currency: price.currency,
              price: Number(price.price),
              sku: variant.sku || undefined,
              isActive: price.active,
              validFrom: price.validFrom,
              validTo: price.validTo,
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
          prices: mappedPrices,
        });
      }
      // Convert to model with variants and fees
      const product = this.convertToModel({
        ...productData,
        fees,
        variants: variantPayload,
      } as any);
      return this.convertToPublic(product);
    });
    return resList[0];
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
      variants: item.variants || [],
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
      raw: false, // Use model instance to properly handle associations
    });
    if (!find) {
      throw new NotFoundException('Product not found');
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
            as: 'prices',
          },
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
          validTo: price.validTo,
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
        prices: mappedPrices,
      });
    }
    // Convert model instance to plain object for convertToModel
    // Sequelize model instances can be accessed like plain objects, but toJSON() ensures proper conversion
    const productData = find.toJSON ? find.toJSON() : find;
    return this.convertToModel({
      ...productData,
      fees,
      variants: variantPayload,
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
      modifiedIp: cIp,
    };
    const product = await this.productRepository.create(createObj);
    await this.upsertVariantsAndPrices(product.productId, this.resolveIncomingVariants(obj));
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
      additionalInfo: obj.additionalInfo || {},
      hsnCode: obj.hsnCode,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.productRepository.update(updateObj, {
      where: { productId: id },
    });
    await this.upsertVariantsAndPrices(id, this.resolveIncomingVariants(obj));
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
    const products = await this.productRepository.scope('list').findAll({
      where: { active: true },
      order: [['createdAt', 'DESC']],
      nest: true,
    });
    return products.map((item: any) => this.convertToModel(item));
  }

  private resolveIncomingVariants(obj: IManageProduct): IProductVariant[] {
    if (obj.variants && obj.variants.length > 0) {
      return obj.variants;
    }
    if (obj.fees && obj.fees.length > 0) {
      return this.feesToVariants(obj.fees);
    }
    return [];
  }

  private feesToVariants(fees: IProductFee[]): IProductVariant[] {
    const variantMap = new Map<string, IProductVariant>();
    for (const fee of fees) {
      const key = `${fee.quantity}_${fee.unit}`;
      let variant = variantMap.get(key);
      if (!variant) {
        variant = {
          productVariantId: 0,
          quantityValue: fee.quantity,
          quantityUnit: fee.unit,
          sku: fee.sku,
          prices: [],
        };
        variantMap.set(key, variant);
      }
      variant.prices!.push({
        currency: fee.currency,
        price: fee.price,
        active: fee.isActive !== undefined ? fee.isActive : true,
        validFrom: fee.validFrom ?? null,
        validTo: fee.validTo ?? null,
      });
    }
    return Array.from(variantMap.values());
  }

  // Upsert variants by productVariantId: existing rows are updated in place
  // (keeps FKs from txn_member_product_order_items intact); new rows are created;
  // variants no longer in the payload stay in the table but all their prices are
  // marked inactive so they disappear from public/admin listings.
  private async upsertVariantsAndPrices(
    productId: number,
    incomingVariants: IProductVariant[],
  ): Promise<void> {
    const existing = await this.productVariantRepository.findAll({ where: { productId } });
    const existingById = new Map(existing.map((v) => [v.productVariantId, v]));
    const keptIds = new Set<number>();

    for (const variant of incomingVariants) {
      const incomingId = variant.productVariantId ?? 0;
      if (incomingId > 0 && existingById.has(incomingId)) {
        await this.productVariantRepository.update(
          {
            quantityValue: variant.quantityValue,
            quantityUnit: variant.quantityUnit,
            sku: variant.sku || null,
          },
          { where: { productVariantId: incomingId } },
        );
        await this.productPriceRepository.destroy({
          where: { productVariantId: incomingId },
        });
        await this.createPricesForVariant(incomingId, variant.prices || []);
        keptIds.add(incomingId);
      } else {
        const created = await this.productVariantRepository.create({
          productId,
          quantityValue: variant.quantityValue,
          quantityUnit: variant.quantityUnit,
          sku: variant.sku || null,
        });
        await this.createPricesForVariant(created.productVariantId, variant.prices || []);
      }
    }

    for (const existingVariant of existing) {
      if (!keptIds.has(existingVariant.productVariantId)) {
        await this.productPriceRepository.update(
          { active: false },
          { where: { productVariantId: existingVariant.productVariantId } },
        );
      }
    }
  }

  private async createPricesForVariant(
    productVariantId: number,
    prices: IProductPrice[],
  ): Promise<void> {
    for (const price of prices) {
      await this.productPriceRepository.create({
        productVariantId,
        currency: price.currency,
        price: price.price,
        active: price.active !== undefined ? price.active : true,
        validFrom: this.toDateOrNull(price.validFrom),
        validTo: this.toDateOrNull(price.validTo),
      });
    }
  }

  private toDateOrNull(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    return typeof value === 'string' ? new Date(value) : value;
  }
}

