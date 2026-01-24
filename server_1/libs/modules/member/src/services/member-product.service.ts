import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberProduct } from '../models';
import { TxnMemberProductOrderItem } from '../models';
import {
  BusinessTypeEnum,
  ConfigParam,
  IAddress,
  ICalculateTaxRequest,
  ICalculateTaxResponse,
  ICalculateProductVariantTaxRequest,
  ICalculateProductVariantTaxResponse,
  IProductVariantTaxResult,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IManageMemberProduct,
  IMemberInfo,
  IMemberProduct,
  IMemberProductMasterData, IMemberProductOrderItemBasic,
  IPaymentLinkResponse, IProductPrice,
  ITableList,
  mapPaymentToInvoiceDocument,
  MediaForEnum,
  PaymentSourceEnum,
  PaymentStatusEnum,
  TableEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, Env, MstFranchise, PaymentValidationUtil } from '@server_1/core';
import {
  AddressService,
  CountryService,
  IFileModel,
  InvoicePdfService,
  PaymentUtil,
  PaymentModeService,
  PaymentStatusService,
  StateService,
} from '@server_1/platform';
import { ProductService } from '@server_1/modules/product';
import { TaxEngineService, TaxInput } from '@server_1/modules/tax-engine';
import { FranchiseService, FranchisePaymentGatewayService } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { Sequelize } from 'sequelize-typescript';
import fs from 'fs';
import { find } from 'lodash';

@Injectable()
export class MemberProductService {
  rootFolderPath = `${Env.persistentStorageAssetPath}`;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly addressService: AddressService,
    private readonly paymentModeService: PaymentModeService,
    private readonly paymentStatusService: PaymentStatusService,
    private readonly productService: ProductService,
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
    private readonly taxEngineService: TaxEngineService,
    private readonly franchiseService: FranchiseService,
    private readonly franchisePaymentGatewayService: FranchisePaymentGatewayService,
    private readonly paymentGatewayResolverService: PaymentGatewayResolverService,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly invoicePdfService: InvoicePdfService,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct,
    @InjectModel(TxnMemberProductOrderItem)
    private readonly memberProductOrderItemRepository: typeof TxnMemberProductOrderItem,
    private sequelize: Sequelize,
  ) {}

  /**
   * Get all member products for a member
   * @param memberId - Member ID
   * @returns List of member products
   */
  public async findAll(memberId: number): Promise<ITableList<IMemberProduct>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const { rows, count } = await this.memberProductRepository.scope('list').findAndCountAll({
      where: {
        memberId,
        active: true,
      },
      order: [['paymentDate', 'DESC']],
    });
    return <ITableList<IMemberProduct>>{
      tableData: rows.map((item: any) => this.convertToModel(item)),
      count,
    };
  }

  /**
   * Get member product by ID
   * @param memberId - Member ID
   * @param productId - Product ID
   * @returns Product details
   */
  public async findById(memberId: number, productId: number): Promise<IMemberProduct> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const product = await this.memberProductRepository.scope('details').findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Member product not found');
    }
    return this.convertToModel(product);
  }

  /**
   * Convert database model to IMemberProduct interface
   */
  private convertToModel(item: TxnMemberProduct): IMemberProduct {
    return <IMemberProduct>{
      memberProductId: item.memberProductId,
      memberId: item.memberId,
      memberName: `${item.member?.firstName || ''} ${item.member?.lastName || ''}`.trim(),
      paymentModeId: item.paymentModeId,
      paymentMode: item.paymentMode?.paymentMode,
      addressId: item.addressId,
      memberAddress: item.memberAddress,
      billingAddressId: item.billingAddressId,
      transactionId: item.transactionId,
      paymentDate: item.paymentDate,
      invoiceId: item.invoiceId,
      paymentStatusId: item.paymentStatusId,
      paymentStatus: item.paymentStatus?.paymentStatus,
      promoCode: item.promoCode,
      refundObj: item.refundObj,
      paymentGatewayResponse: item.paymentGatewayResponse,
      gstNumber: item.gstNumber,
      paymentSource: item.paymentSource as PaymentSourceEnum,
      gatewayProvider: item.gatewayProvider,
      gatewayOrderId: item.gatewayOrderId,
      gatewayPaymentId: item.gatewayPaymentId,
      paymentLink: item.paymentLink,
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
      orderAmount: item.subTotalAmount,
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      totalAmount: item.totalAmount,
      subTotalAmount: item.subTotalAmount,
      roundingAdjustment: item.roundingAdjustment,
      currency: item.currency,
      franchise: item.franchise?.companyName,
      franchiseId: item.franchiseId,
      orderItems: Array.isArray(item.orderItems) ? item.orderItems.map(orderItem => ({
        memberProductOrderItemId: orderItem.memberProductOrderItemId,
        memberProductId: orderItem.memberProductId,
        productId: orderItem.productId,
        productVariantId: orderItem.productVariantId,
        productName: orderItem.productName,
        quantityLabel: orderItem.quantityLabel,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        baseAmount: orderItem.baseAmount,
        discountAmount: orderItem.discountAmount,
        effectiveTaxRate: orderItem.effectiveTaxRate,
        taxAmount: orderItem.taxAmount,
        totalAmount: orderItem.totalAmount,
        taxObj: orderItem.taxObj,
        taxType: orderItem.taxType,
        taxMode: orderItem.taxMode,
        jurisdiction: orderItem.jurisdiction,
        invoiceNote: orderItem.invoiceNote,
      })) : [],
    };
  }

  public async loadMasterData(memberId: number): Promise<IMemberProductMasterData> {
    const [paymentModes, product, paymentStatuses, addresses] = await Promise.all([
      this.paymentModeService.getDropdownList(),
      this.productService.getProductList(),
      this.paymentStatusService.getDropdownList(),
      this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId),
    ]);
    const taxApplicable = this.appConfigService.getBoolean(ConfigParam.GST_ENABLED, true, false);
    const paymentSource: IDropdownItem[] = Object.values(PaymentSourceEnum).map((source) => ({
      id: source,
      label: source,
      selected: false,
    }));
    return <IMemberProductMasterData>{
      paymentMode: paymentModes,
      product: product,
      paymentStatus: paymentStatuses,
      addresses: addresses as IAddress[],
      taxApplicable: taxApplicable,
      paymentSource: paymentSource,
    };
  }

  /**
   * Delete (soft delete) a product order
   * @param memberId - Member ID
   * @param productId - Product order ID
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   */
  public async delete(
    memberId: number,
    productId: number,
    requestedIp: string,
    adminId: number,
  ): Promise<void> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Find product order
    const productOrder = await this.memberProductRepository.findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
      },
    });
    if (!productOrder) {
      throw new NotFoundException('Product order not found');
    }
    // Soft delete
    await productOrder.update({
      active: false,
      modifiedBy: adminId,
      modifiedIp: requestedIp,
    });
  }

  /**
   * Get supported payment gateways for a member based on franchise and currency
   * @param memberId - Member ID
   * @param currencyCode - Currency code
   * @returns List of supported payment gateways
   */
  public async getSupportedPaymentGateways(
    memberId: number,
    currencyCode: string,
  ): Promise<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  > {
    // Verify a member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get franchise for products
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.PRODUCT);
    if (!franchise || franchise.length === 0) {
      return [];
    }
    // Get all active gateways for franchise and currency
    const gateways = await this.franchisePaymentGatewayService.findActiveByFranchiseAndCurrency({
      franchiseId: franchise[0].id as number,
      currency: currencyCode,
    });
    // Transform to response format
    return gateways.map((gateway: any) => {
      const paymentGateway = gateway.paymentGateway;
      return {
        franchisePaymentGatewayId: gateway.franchisePaymentGatewayId,
        gatewayCode: paymentGateway?.code || '',
        gatewayName: paymentGateway?.name || '',
        providerCountryCode: paymentGateway?.providerCountryCode || '',
        currencyCode: gateway.currencyCode,
        isPrimary: gateway.isPrimary,
        supportsDomestic: gateway.supportsDomestic,
        supportsInternational: gateway.supportsInternational,
      };
    });
  }

  /**
   * Create a payment link with gateway selection
   * @param memberId - Member ID
   * @param payload - ICreatePaymentLinkRequest
   * @returns Payment link details
   */
  public async createPaymentLink(
    memberId: number,
    payload: ICreatePaymentLinkRequest,
  ): Promise<IPaymentLinkResponse> {
    // Verify a member exists
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get franchise for products
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.PRODUCT);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for products');
    }
    if (payload.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    // Use PaymentGatewayResolverService to find the gateway
    let resolvedGateway;
    try {
      resolvedGateway = await this.paymentGatewayResolverService.resolve({
        franchiseId: franchise[0].id as number,
        currency: payload.currency,
        isInternational: false,
        amount: payload.amount,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to resolve payment gateway',
      );
    }
    // If a specific gateway ID was provided, validate it matches the resolved gateway
    if (
      payload.franchisePaymentGatewayId &&
      resolvedGateway.franchisePaymentGatewayId !== payload.franchisePaymentGatewayId
    ) {
      throw new BadRequestException(
        'Selected payment gateway is not available for the given criteria',
      );
    }
    const gatewayCode = resolvedGateway.gatewayCode;
    // Get payment gateway credentials
    const credentialMode = this.appConfigService.getString(ConfigParam.PAYMENT_MODE);
    const credentials = await this.paymentGatewayCredentialService.getActiveCredentials(
      resolvedGateway.franchisePaymentGatewayId,
      credentialMode,
    );
    if (!credentials) {
      throw new BadRequestException(
        `Payment gateway credentials not found for gateway ID: ${resolvedGateway.franchisePaymentGatewayId} in mode: ${credentialMode}`,
      );
    }
    const keyId = credentials.apiKeyEncrypted;
    const keySecret = credentials.apiSecretEncrypted;
    // Prepare customer details from member if not provided
    const customerDetails = payload.customer || {
      name: member.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : undefined,
      email: member.emailId || undefined,
      contact: member.contactNumber || undefined,
    };
    // Prepare description
    const paymentDescription =
      payload.description || `Product Order Payment for Member ID: ${memberId}`;
    // Prepare notes with member ID
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      ...payload.notes,
    };
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    const paymentLink = await adaptor.createPaymentLink(
      payload.amount,
      payload.currency,
      paymentDescription,
      customerDetails,
      paymentNotes,
      {
        keyId,
        keySecret,
      },
    );
    return <IPaymentLinkResponse>{
      shortUrl: paymentLink.short_url,
      id: paymentLink.id,
      gatewayCode: gatewayCode,
    };
  }

  /**
   * Generate invoice PDF for a member product order using the universal invoice system
   * @param memberId - Member ID
   * @param productId - Product order ID
   * @returns File model with PDF details
   */
  public async generateInvoicePDF(memberId: number, productId: number): Promise<IFileModel> {
    // Get product order with all details
    const productOrder = await this.memberProductRepository.scope('details').findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
      },
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: true,
        },
      ],
    });
    if (!productOrder) {
      throw new NotFoundException('Product order not found');
    }
    // Get member
    const member = await this.memberRepository.scope('details').findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get franchise for products
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.PRODUCT);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for products');
    }
    // Get franchise address
    const franchiseAddress = await this.addressService.findByTableIdAndPk(
      TableEnum.MST_FRANCHISES,
      franchise[0].id as number,
    );
    // Get billing address
    let billingAddress: IAddress | null = null;
    if (productOrder.billingAddress) {
      billingAddress = {
        addressId: productOrder.billingAddress.addressId,
        addressName: productOrder.billingAddress.addressName,
        postalAddress: productOrder.billingAddress.postalAddress,
        cityVillage: productOrder.billingAddress.cityVillage,
        stateId: productOrder.billingAddress.stateId,
        state: productOrder.billingAddress.state?.state || '',
        countryId: productOrder.billingAddress.countryId,
        country: productOrder.billingAddress.country.country || '',
        countryCode: productOrder.billingAddress.country.countryCode || '',
        pinCode: productOrder.billingAddress.pinCode,
      } as IAddress;
    } else if (productOrder.address) {
      billingAddress = {
        addressId: productOrder.address.addressId,
        addressName: productOrder.address.addressName,
        postalAddress: productOrder.address.postalAddress,
        cityVillage: productOrder.address.cityVillage,
        stateId: productOrder.address.stateId,
        state: productOrder.address.state?.state || '',
        countryId: productOrder.address.countryId,
        country: productOrder.address.country.country || '',
        countryCode: productOrder.address.country.countryCode || '',
        pinCode: productOrder.address.pinCode,
      } as IAddress;
    }
    if (!billingAddress) {
      throw new BadRequestException('Billing address not found for invoice generation');
    }
    // Convert product order to model to get calculated amounts
    const productModel = this.convertToModel(productOrder);
    // Prepare member info
    const memberInfo: IMemberInfo = {
      fullName: productModel.memberName,
      emailId: member.emailId,
      contactNumber: member.contactNumber,
    };
    // Get product details for description from paymentObj
    let productDescription = `Product Order - ID: ${productId}`;
    const invoiceDoc = mapPaymentToInvoiceDocument(
      {
        ...productModel,
        program: '',
        programPlan: '',
        programId: 0,
        programPlanId: 0,
        memberPaymentId: productModel.memberProductId,
      } as any,
      franchise[0] as any,
      billingAddress,
      TransactionType.PRODUCT,
      franchiseAddress,
      productDescription,
      memberInfo,
    );
    const fileName = `invoice-${productModel.memberProductId}.pdf`;
    const relativePath = `${MediaForEnum.DOWNLOADS}/${memberId}/invoices`;
    const destinationFolderPath = `${this.rootFolderPath}/${relativePath}`;
    // CREATE DIRECTORY IF NOT EXISTS
    if (!fs.existsSync(destinationFolderPath)) {
      fs.mkdirSync(destinationFolderPath, { recursive: true });
    }
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    // Generate PDF using the new InvoicePdfService
    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoiceDoc);
    const base64Buffer = pdfBuffer.toString('base64');
    // Write PDF buffer to destination folder
    fs.writeFileSync(destinationPath, Uint8Array.from(pdfBuffer));
    return {
      filePath: relativePath,
      fileName: fileName,
      buffer: base64Buffer,
    } as IFileModel;
  }

  public async calculateProductTax(memberId: number, payload: ICalculateProductVariantTaxRequest): Promise<ICalculateProductVariantTaxResponse> {
    // Verify member exists
    const member = await this.memberRepository.scope('details').findOne({
      where: { memberId },
      include: [
        {
          model: MstFranchise,
          as: 'franchise',
          required: false,
        },
      ],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get franchise for products
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.PRODUCT);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for products');
    }
    // Get addresses
    const addresses = await this.findAddresses(
      franchise[0],
      memberId,
      payload.addressId,
      payload.billingAddressId,
    );
    const memberAddressSnapshot = addresses.memberAddressSnapshot;
    const franchiseAddress = addresses.franchiseAddress;
    // Calculate tax for each product variant
    const results: IProductVariantTaxResult[] = [];
    for (const item of payload.items) {
      // Get product details
      const product = await this.productService.fetchById(item.productId);
      // Find the variant
      const variant = product.variants?.find((v) => v.productVariantId === item.productVariantId);
      if (!variant) {
        throw new BadRequestException(
          `Variant ${item.productVariantId} not found for product ${item.productId}`,
        );
      }
      // Find the price for the specified currency
      const variantPrice: IProductPrice = find(variant.prices, { currency: item.currencyCode });
      if (!variantPrice) {
        throw new BadRequestException(
          `Price not found for variant ${item.productVariantId} with currency ${item.currencyCode}`,
        );
      }
      // Calculate tax for this item
      const taxCalculationResult = await this.calculateTax(
        item.productId,
        franchise[0],
        {
          orderAmount: variantPrice.price,
          discountAmount: 0,
          currencyCode: item.currencyCode,
          billingAddressId: payload.billingAddressId || undefined,
          addressId: payload.addressId || undefined,
        },
        franchiseAddress,
        memberAddressSnapshot.billingAddress,
      );
      results.push({
        productId: item.productId,
        productVariantId: item.productVariantId,
        currencyCode: item.currencyCode,
        price: variantPrice.price,
        taxPercentage: taxCalculationResult.taxPercentage,
        taxAmount: taxCalculationResult.taxAmount,
        totalAmount: taxCalculationResult.totalAmount,
        taxObj: taxCalculationResult.taxObj,
        taxType: taxCalculationResult.taxType,
        taxMode: taxCalculationResult.taxMode,
        invoiceNote: taxCalculationResult.invoiceNote,
        isLutApplied: taxCalculationResult.isLutApplied,
        jurisdiction: taxCalculationResult.jurisdiction,
      });
    }
    return { items: results };
  }

  /**
   * Calculate tax for product order
   * Used by frontend to get real-time tax calculations
   */
  public async calculateTax(
    productId: number,
    franchise: IDropdownItem,
    payload: ICalculateTaxRequest,
    billingAddress: IAddress | null,
    franchiseAddress: IAddress | null,
  ): Promise<ICalculateTaxResponse> {
    // Validate billing address is provided when tax is applicable
    if (!billingAddress) {
      throw new BadRequestException(
        'Billing address is required for tax calculation. Please provide billingAddressId or addressId.',
      );
    }
    // Get country and state codes from addresses
    const addressCodes = await PaymentUtil.extractAddressCodes(
      franchiseAddress,
      billingAddress,
      this.countryService,
      this.stateService,
    );
    const supplierCountryCode = addressCodes.supplierCountryCode;
    const supplierStateCode = addressCodes.supplierStateCode;
    const customerCountryCode = addressCodes.customerCountryCode;
    const customerStateCode = addressCodes.customerStateCode;
    // Use tax engine to calculate tax
    const taxInput: TaxInput = {
      baseAmount: payload.orderAmount,
      discountAmount: payload.discountAmount,
      supplierCountryCode,
      supplierStateCode: supplierStateCode || undefined,
      customerCountryCode,
      customerStateCode: customerStateCode || undefined,
      referenceId: productId,
      franchiseId: franchise.id as number,
      currency: payload.currencyCode,
      transactionType: TransactionType.PRODUCT,
    };
    const taxResult = await this.taxEngineService.calculate(taxInput);
    // Calculate base amounts
    return <ICalculateTaxResponse>{
      orderAmount: payload.orderAmount,
      taxAmount: taxResult.taxAmount,
      totalAmount: taxResult.totalAmount,
      discountAmount: payload.discountAmount,
      taxType: taxResult.taxType,
      taxMode: taxResult.taxMode,
      taxPercentage: taxResult.taxPercentage,
      taxObj: taxResult.taxObj,
      invoiceNote: taxResult.invoiceNote || null,
      currency: payload.currencyCode,
      isLutApplied: taxResult.isLutApplied,
      jurisdiction: {
        entityCountry: taxResult.entityCountry,
        customerCountry: taxResult.customerCountry,
        placeOfSupply: taxResult.placeOfSupply,
      },
    };
  }

  private async findAddresses(
    franchise: IDropdownItem,
    memberId: number,
    addressId?: number,
    billingAddressId?: number,
  ) {
    // Handle address if provided
    // Load all member addresses at once
    const addresses = await this.addressService.filterByTableIdAndPk(
      TableEnum.TXN_MEMBER,
      memberId,
    );
    // Resolve selected addresses
    const billingAddress: IAddress | null =
      (billingAddressId && addresses.find((a) => a.addressId === billingAddressId)) || null;
    const primaryAddress: IAddress | null =
      (addressId && addresses.find((a) => a.addressId === addressId)) || null;
    // Build address snapshot to store with payment
    const memberAddressSnapshot = {
      address: primaryAddress,
      billingAddress: billingAddress,
    };
    // Validate billing address country if the billing address exists and tax is applicable
    if (billingAddress && !billingAddress.countryId) {
      throw new BadRequestException('Billing address country is required when tax is applicable');
    }
    // Get franchise address for tax calculation
    let franchiseAddress: IAddress | null = null;
    if (franchise.id) {
      franchiseAddress = await this.addressService.findByTableIdAndPk(
        TableEnum.MST_FRANCHISES,
        franchise.id as number,
      );
    }
    return {
      memberAddressSnapshot,
      franchiseAddress,
    };
  }

  private async buildOrderItem(orderItems: IMemberProductOrderItemBasic[], discountAmount: number) {
    const orderItemObjs = [];
    // calculate order item level tax calculation
    if (orderItems) {
      for (const item of orderItems) {
        // Get product details
        const product = await this.productService.fetchById(item.productId);
        // Find the variant to get quantityValue and quantityUnit
        const variant = product.variants?.find((v) => v.productVariantId === item.productVariantId);
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.productVariantId} not found for product ${item.productId}`,
          );
        }
        const variantFees: IProductPrice = find(variant.prices, { currency: item.currency });
        // Calculate tax if not already calculated
        orderItemObjs.push({
          productId: item.productId,
          productVariantId: item.productVariantId,
          productName: product.name,
          quantity: item.quantity, // Admin ordered quantity
          quantityLabel: `${variant.quantityValue} ${variant.quantityUnit}`, // Variant quantity + unit (e.g., "100gm")
          unitPrice: variantFees.price,
          baseAmount: variantFees.price * item.quantity,
        });
      }
    }
    const orderSubtotal = orderItemObjs.reduce((acc, item) => acc + item.baseAmount, 0);
    // Apply discount logic
    for (const orderItem of orderItemObjs) {
      // Allocate discount proportionally by item value:
      orderItem.discountAmount = (orderItem.baseAmount / orderSubtotal) * discountAmount;
    }
    return orderItemObjs;
  }

  /**
   * Create a new product order
   * @param memberId - Member ID
   * @param obj - Product order data
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   * @returns Created product order
   */
  public async create(
    memberId: number,
    obj: IManageMemberProduct,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberProduct> {
    // Verify member exists
    const member = await this.memberRepository.scope('details').findOne({
      where: { memberId },
      include: [
        {
          model: MstFranchise,
          as: 'franchise',
          required: false,
        },
      ],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Validate mandatory fields for MANUAL payment source
    PaymentValidationUtil.validateManualPaymentSource({
      paymentSource: obj.paymentSource,
      paymentModeId: obj.paymentModeId,
      paymentDate: obj.paymentDate,
      paymentStatusId: obj.paymentStatusId,
      transactionId: obj.transactionId,
    });
    // Get franchise for products
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.PRODUCT);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for products');
    }
    const t = await this.sequelize.transaction();
    try {
      const addresses = await this.findAddresses(
        franchise[0],
        memberId,
        obj.addressId,
        obj.billingAddressId,
      );
      const memberAddressSnapshot = addresses.memberAddressSnapshot;
      const orderItemObjs = [];
      const tempOrderItem = await this.buildOrderItem(obj.orderItems, obj.discountAmount || 0);
      // calculate order item level tax calculation
      for (const item of tempOrderItem) {
        const taxCalculationResult = await this.calculateTax(
          item.productId,
          franchise[0],
          {
            orderAmount: item.baseAmount,
            discountAmount: item.discountAmount,
            currencyCode: item.currencyCode,
            billingAddressId: obj.billingAddressId || undefined,
            addressId: obj.addressId || undefined,
          },
          addresses.franchiseAddress,
          memberAddressSnapshot.billingAddress,
        );
        orderItemObjs.push({
          productId: item.productId,
          productVariantId: item.productVariantId,
          productName: item.productName,
          quantity: item.quantity, // Admin ordered quantity
          quantityLabel: item.quantityLabel,
          unitPrice: item.unitPrice,
          baseAmount: taxCalculationResult.orderAmount,
          discountAmount: item.discountAmount,
          taxAmount: taxCalculationResult.taxAmount,
          effectiveTaxRate: taxCalculationResult.taxPercentage,
          totalAmount: taxCalculationResult.totalAmount,
          taxObj: taxCalculationResult.taxObj,
          taxType: taxCalculationResult.taxType,
          taxMode: taxCalculationResult.taxMode,
          isLutApplied: taxCalculationResult.isLutApplied,
          jurisdiction: taxCalculationResult.jurisdiction,
          invoice_note: taxCalculationResult.invoiceNote,
        });
      }
      const totalOrderAmount = orderItemObjs.reduce((acc, item) => acc + item.baseAmount, 0);
      const totalTaxAmount = orderItemObjs.reduce((acc, item) => acc + item.taxAmount, 0);
      const totalAmount = orderItemObjs.reduce((acc, item) => acc + item.totalAmount, 0);
      const totalDiscount = orderItemObjs.reduce((acc, item) => acc + item.totalAmount, 0);
      // Build payment object structure
      const productOrderData: any = {
        memberId,
        franchiseId: franchise[0].id as number,
        paymentModeId: obj.paymentModeId || null,
        addressId: obj.addressId || null,
        billingAddressId: obj.billingAddressId || null,
        transactionId: obj.transactionId || null,
        paymentDate: obj.paymentDate || new Date(),
        paymentStatusId: obj.paymentStatusId || PaymentStatusEnum.PENDING,
        promoCode: obj.promoCode || null,
        isTaxApplicable: true,
        refundObj: null,
        paymentGatewayResponse: null,
        gstNumber: obj.gstNumber || null,
        memberAddress: memberAddressSnapshot,
        paymentSource: obj.paymentSource,
        subTotalAmount: totalOrderAmount,
        discountAmount: totalDiscount,
        taxAmount: totalTaxAmount,
        totalAmount: totalAmount,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      };
      if (obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY) {
        productOrderData.paymentLink = obj.paymentLink;
        productOrderData.gatewayOrderId = obj.gatewayOrderId;
        productOrderData.gatewayProvider = obj.gatewayProvider;
        productOrderData.gatewayPaymentId = obj.gatewayPaymentId;
      }
      const productOrder = await this.memberProductRepository.create(productOrderData, {
        transaction: t,
      });
      // Create order items
      for (const itemOrder of orderItemObjs) {
        itemOrder.memberProductId = productOrder.memberProductId;
      }
      await this.memberProductOrderItemRepository.bulkCreate(orderItemObjs, { transaction: t });
      await t.commit();
      // Fetch the created product order with relationships
      const createdOrder = await this.memberProductRepository.scope('details').findOne({
        where: { memberProductId: productOrder.memberProductId },
      });
      return this.convertToModel(createdOrder!);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

