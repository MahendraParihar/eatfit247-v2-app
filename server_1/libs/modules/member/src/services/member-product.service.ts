import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberProduct, TxnMemberProductOrderItem } from '../models';
import {
  BusinessTypeEnum,
  ConfigParam,
  IAddress,
  ICalculateProductVariantTaxRequest,
  ICalculateProductVariantTaxResponse,
  ICalculateTaxRequest,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IManageMemberProduct,
  IMemberInfo,
  IMemberProduct,
  IMemberProductMasterData,
  IMemberProductOrderItemBasic,
  IPaymentGateway,
  IPaymentLinkResponse,
  IProductPrice,
  IProductVariantTaxResult,
  IShipment,
  ITableList,
  mapProductOrderToInvoiceDocument,
  MediaForEnum,
  PaymentGatewayEnum,
  PaymentSourceEnum,
  PaymentStatusEnum,
  TableEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import {
  AppConfigService,
  CommonFunctionsUtil,
  Env,
  MstFranchise,
  PaymentValidationUtil,
} from '@server_1/core';
import {
  AddressService,
  CountryService,
  IFileModel,
  InvoicePdfService,
  InvoiceSequenceService,
  PaymentModeService,
  PaymentStatusService,
  PaymentUtil,
  StateService,
} from '@server_1/platform';
import { ProductService } from '@server_1/modules/product';
import { TaxEngineService, TaxInput } from '@server_1/modules/tax-engine';
import { FranchisePaymentGatewayService, FranchiseService } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { Sequelize } from 'sequelize-typescript';
import { promises as fs } from 'fs';
import { find, map, sumBy } from 'lodash';
import { MemberService } from './member.service';

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
    private readonly invoiceSequenceService: InvoiceSequenceService,
    private readonly memberService: MemberService,
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
    await this.memberService.verifyMember(memberId);
    const { rows, count } = await this.memberProductRepository.scope('details').findAndCountAll({
      where: {
        memberId,
        active: true,
      },
      order: [['paymentDate', 'DESC']],
    });
    const shipmentDetails: IShipment[] = [];
    return <ITableList<IMemberProduct>>{
      tableData: rows.map((item: any) => this.convertToModel(item, shipmentDetails)),
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
    await this.memberService.verifyMember(memberId);
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
    const shipmentDetails: IShipment[] = [];
    return this.convertToModel(product, shipmentDetails);
  }

  /**
   * Get franchise for products business type
   * @returns Franchise array
   * @throws BadRequestException if franchise not found
   */
  private async getProductFranchise(): Promise<IDropdownItem[]> {
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.PRODUCT);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for products');
    }
    return franchise;
  }

  /**
   * Transform gateway data to IPaymentGateway format
   * @param gateways - Gateway data from repository
   * @returns Transformed gateway array
   */
  private transformGateways(gateways: any[]): IPaymentGateway[] {
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
   * Resolve payment gateway and get credentials
   * @param franchiseId - Franchise ID
   * @param currency - Currency code
   * @param amount - Payment amount
   * @param requestedGatewayId - Optional specific gateway ID to validate
   * @returns Resolved gateway and credentials
   */
  private async resolveGatewayAndCredentials(
    franchiseId: number,
    currency: string,
    amount: number,
    requestedGatewayId?: number,
  ): Promise<{
    resolvedGateway: any;
    keyId: string;
    keySecret: string;
    gatewayCode: string;
  }> {
    // Resolve gateway
    let resolvedGateway;
    try {
      resolvedGateway = await this.paymentGatewayResolverService.resolve({
        franchiseId,
        currency,
        isInternational: false,
        amount,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to resolve payment gateway',
      );
    }
    // Validate requested gateway if provided
    if (requestedGatewayId && resolvedGateway.franchisePaymentGatewayId !== requestedGatewayId) {
      throw new BadRequestException(
        'Selected payment gateway is not available for the given criteria',
      );
    }
    const gatewayCode = resolvedGateway.gatewayCode;
    // Get credentials
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
    return {
      resolvedGateway,
      keyId: credentials.apiKeyEncrypted,
      keySecret: credentials.apiSecretEncrypted,
      gatewayCode,
    };
  }

  /**
   * Prepare customer details from member or use provided details
   * @param member - Member record
   * @param providedCustomer - Optional customer details from payload
   * @returns Customer details object
   */
  private prepareCustomerDetails(
    member: TxnMember,
    providedCustomer?: { name?: string; email?: string; contact?: string },
  ): { name?: string; email?: string; contact?: string } {
    if (providedCustomer) {
      return providedCustomer;
    }
    return {
      name: member.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : undefined,
      email: member.emailId || undefined,
      contact: member.contactNumber || undefined,
    };
  }

  /**
   * Calculate tax for order items and build complete order item objects
   * @param tempOrderItems - Initial order items with base amounts
   * @param franchise - Franchise dropdown item
   * @param franchiseAddress - Franchise address
   * @param billingAddress - Billing address
   * @returns Complete order items with tax calculations
   */
  private async calculateOrderItemsTax(
    tempOrderItems: Array<{
      productId: number;
      productVariantId: number;
      productName: string;
      quantity: number;
      quantityLabel: string;
      quantityValue: number;
      quantityUnit: string;
      baseAmount: number;
      discountAmount: number;
      currencyCode?: string;
    }>,
    franchise: IDropdownItem,
    franchiseAddress: IAddress | null,
    billingAddress: IAddress | null,
  ): Promise<
    Array<{
      productId: number;
      productVariantId: number;
      productName: string;
      quantity: number;
      quantityLabel: string;
      quantityValue: number;
      quantityUnit: string;
      unitPrice: number;
      baseAmount: number;
      discountAmount: number;
      taxAmount: number;
      effectiveTaxRate: number;
      totalAmount: number;
      taxObj: any;
      taxType: string;
      taxMode: string;
      isLutApplied?: boolean;
      jurisdiction: any;
      invoiceNote?: string | null;
    }>
  > {
    const orderItemObjs = [];
    for (const item of tempOrderItems) {
      const taxCalculationResult = await this.calculateTax(
        item.productId,
        franchise,
        {
          orderAmount: item.baseAmount,
          discountAmount: item.discountAmount,
          currency: item.currencyCode,
        },
        franchiseAddress,
        billingAddress,
      );
      orderItemObjs.push({
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        quantity: item.quantity,
        quantityLabel: item.quantityLabel,
        unitPrice: taxCalculationResult.orderAmount / item.quantity,
        quantityValue: item.quantityValue,
        quantityUnit: item.quantityUnit,
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
        invoiceNote: taxCalculationResult.invoiceNote,
      });
    }
    return orderItemObjs;
  }

  /**
   * Convert database model to IMemberProduct interface
   */
  private convertToModel(item: TxnMemberProduct, shipments: IShipment[]): IMemberProduct {
    const memberProductOrderItemIds: number[] = item.orderItems
      ? map(item.orderItems, 'memberProductOrderItemId')
      : [];

    const productShipments: IShipment[] = [];

    for (const shipment of shipments) {
      if (!shipment.shipmentItems || shipment.shipmentItems.length === 0) {
        continue;
      }

      const matchingItems = shipment.shipmentItems.filter(
        (shipmentItem) =>
          shipmentItem.memberProductOrderItemId !== undefined &&
          memberProductOrderItemIds.includes(shipmentItem.memberProductOrderItemId),
      );

      if (matchingItems.length > 0) {
        productShipments.push({
          ...shipment,
          shipmentItems: matchingItems,
        });
      }
    }

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
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      subTotalAmount: CommonFunctionsUtil.toNumber(item.subTotalAmount),
      discountAmount: CommonFunctionsUtil.toNumber(item.discountAmount),
      taxableAmount:
        CommonFunctionsUtil.toNumber(item.subTotalAmount) -
        CommonFunctionsUtil.toNumber(item.discountAmount),
      taxAmount: CommonFunctionsUtil.toNumber(item.taxAmount),
      totalAmount: CommonFunctionsUtil.toNumber(item.totalAmount),
      roundingAdjustment: CommonFunctionsUtil.toNumber(item.roundingAdjustment),
      currency: item.currency,
      franchise: item.franchise?.companyName,
      franchiseId: item.franchiseId,
      shipments: productShipments,
      orderItems: Array.isArray(item.orderItems)
        ? item.orderItems.map((orderItem) => ({
            memberProductOrderItemId: orderItem.memberProductOrderItemId,
            memberProductId: orderItem.memberProductId,
            productId: orderItem.productId,
            productVariantId: orderItem.productVariantId,
            productName: orderItem.productName,
            quantityLabel: orderItem.quantityLabel,
            hsnCode: orderItem.product.hsnCode,
            quantity: CommonFunctionsUtil.toNumber(orderItem.quantity),
            unitPrice: CommonFunctionsUtil.toNumber(orderItem.unitPrice),
            baseAmount: CommonFunctionsUtil.toNumber(orderItem.baseAmount),
            discountAmount:
              orderItem.discountAmount !== null && orderItem.discountAmount !== undefined
                ? CommonFunctionsUtil.toNumber(orderItem.discountAmount)
                : undefined,
            effectiveTaxRate: CommonFunctionsUtil.toNumber(orderItem.effectiveTaxRate),
            taxAmount: CommonFunctionsUtil.toNumber(orderItem.taxAmount),
            totalAmount: CommonFunctionsUtil.toNumber(orderItem.totalAmount),
            taxObj: orderItem.taxObj,
            taxType: orderItem.taxType,
            taxMode: orderItem.taxMode,
            jurisdiction: orderItem.jurisdiction,
            invoiceNote: orderItem.invoiceNote,
          }))
        : [],
    };
  }

  public async loadMasterData(memberId: number): Promise<IMemberProductMasterData> {
    const [paymentModes, product, paymentStatuses, addresses] = await Promise.all([
      this.paymentModeService.getDropdownList(),
      this.productService.getProductList(),
      this.paymentStatusService.getDropdownList(),
      this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId),
    ]);
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
      paymentSource: paymentSource,
    };
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
  ): Promise<IPaymentGateway[]> {
    // Verify a member exists
    await this.memberService.verifyMember(memberId);
    // Get franchise for products
    const franchise = await this.getProductFranchise();
    if (franchise.length === 0) {
      return [];
    }
    // Get all active gateways for franchise and currency
    const gateways = await this.franchisePaymentGatewayService.findActiveByFranchiseAndCurrency({
      franchiseId: franchise[0].id as number,
      currency: currencyCode,
    });
    // Transform to response format
    return this.transformGateways(gateways);
  }

  /**
   * Get supported payment gateways for public checkout (no member required)
   * Reuses the same logic as getSupportedPaymentGateways but without member validation
   */
  public async getSupportedPaymentGatewaysForCheckout(
    currencyCode: string,
  ): Promise<IPaymentGateway[]> {
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
    return this.transformGateways(gateways);
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
    const member = await this.memberService.verifyMember(memberId);
    // Get franchise for products
    const franchise = await this.getProductFranchise();
    if (payload.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    // Resolve gateway and get credentials
    const { resolvedGateway, keyId, keySecret, gatewayCode } =
      await this.resolveGatewayAndCredentials(
        franchise[0].id as number,
        payload.currency,
        payload.amount,
        payload.franchisePaymentGatewayId,
      );
    // Prepare customer details from member if not provided
    const customerDetails = this.prepareCustomerDetails(member, payload.customer);
    // Prepare description
    const paymentDescription =
      payload.description || `Product Order Payment for Member ID: ${memberId}`;
    // Prepare notes with member ID and order type
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      type: 'product',
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
   * Create payment order for embedded checkout
   * Returns order details that can be used with payment gateway SDKs
   */
  public async createPaymentOrder(
    memberId: number,
    payload: ICreatePaymentLinkRequest,
  ): Promise<{
    orderId: string;
    gatewayCode: string;
    keyId: string;
    amount: number;
    currency: string;
    customer: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes: Record<string, any>;
  }> {
    // Verify a member exists
    const member = await this.memberService.verifyMember(memberId);
    // Get franchise for products
    const franchise = await this.getProductFranchise();
    if (payload.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    // Resolve gateway and get credentials
    const { resolvedGateway, keyId, keySecret, gatewayCode } =
      await this.resolveGatewayAndCredentials(
        franchise[0].id as number,
        payload.currency,
        payload.amount,
        payload.franchisePaymentGatewayId,
      );
    // Prepare customer details from member if not provided
    const customerDetails = this.prepareCustomerDetails(member, payload.customer);
    // Prepare description
    const paymentDescription =
      payload.description || `Product Order Payment for Member ID: ${memberId}`;
    // Prepare notes with member ID and order type
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      type: 'product',
      ...payload.notes,
    };
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    // Create order based on a gateway type
    let orderId: string;
    const receipt = `order_${memberId}_${Date.now()}`;
    switch (gatewayCode) {
      case PaymentGatewayEnum.RAZORPAY:
        {
          if (!adaptor.createOrder) {
            throw new BadRequestException('Razorpay createOrder method not available');
          }
          const order = await adaptor.createOrder(
            payload.amount,
            receipt,
            payload.currency,
            paymentNotes,
            {
              keyId,
              keySecret,
            },
          );
          orderId = order.id;
        }
        break;
      case PaymentGatewayEnum.STRIPE:
        {
          const stripeAdapter = adaptor as any;
          if (stripeAdapter.createPaymentIntent) {
            const paymentIntent = await stripeAdapter.createPaymentIntent(
              payload.amount,
              payload.currency,
              paymentDescription,
              customerDetails,
              paymentNotes,
            );
            orderId = paymentIntent.id;
          } else {
            // Fallback to payment link if payment intent is not available
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
            orderId = paymentLink.id;
          }
        }
        break;
      case PaymentGatewayEnum.TELR:
        {
          if (!adaptor.createOrder) {
            throw new BadRequestException('Telr createOrder method not available');
          }
          const order = await adaptor.createOrder(
            payload.amount,
            receipt,
            payload.currency,
            paymentNotes,
            {
              keyId,
              keySecret,
            },
          );
          orderId = order.order?.ref || order.id || receipt;
        }
        break;
      default:
        throw new BadRequestException(`Unsupported payment gateway: ${gatewayCode}`);
    }
    return {
      orderId,
      gatewayCode,
      keyId, // Return keyId for frontend SDK initialization
      amount: payload.amount,
      currency: payload.currency,
      customer: customerDetails,
      notes: paymentNotes,
    };
  }

  /**
   * Verify payment after completion
   */
  public async verifyPayment(
    memberId: number,
    gatewayCode: string,
    paymentId: string,
    orderId?: string,
    signature?: string,
  ): Promise<{ verified: boolean; paymentDetails?: any }> {
    // Verify a member exists
    await this.memberService.verifyMember(memberId);
    // Get franchise for products
    await this.getProductFranchise();
    // Get payment gateway credentials
    const gateways = await this.getSupportedPaymentGatewaysForCheckout('INR');
    const gateway = gateways.find((g) => g.gatewayCode === gatewayCode);
    if (!gateway) {
      throw new BadRequestException(`Payment gateway not found: ${gatewayCode}`);
    }
    const credentialMode = this.appConfigService.getString(ConfigParam.PAYMENT_MODE);
    const credentials = await this.paymentGatewayCredentialService.getActiveCredentials(
      gateway.franchisePaymentGatewayId,
      credentialMode,
    );
    if (!credentials) {
      throw new BadRequestException(
        `Payment gateway credentials not found for gateway: ${gatewayCode}`,
      );
    }
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    if (!adaptor.verifyPayment) {
      throw new BadRequestException(
        `Payment verification not supported for gateway: ${gatewayCode}`,
      );
    }
    // Extract credentials for verification
    const keyId = credentials.apiKeyEncrypted;
    const keySecret = credentials.apiSecretEncrypted;
    return await adaptor.verifyPayment(paymentId, orderId, signature, {
      keyId,
      keySecret,
    });
  }

  /**
   * Generate invoice PDF for a member product order using the universal invoice system
   * @param memberId - Member ID
   * @param productId - Product order ID
   * @returns File model with PDF details
   */
  public async generateInvoicePDF(memberId: number, productId: number): Promise<IFileModel> {
    // Get product order with all details
    const productOrder = await this.memberProductRepository.scope('invoice').findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
      },
    });
    if (!productOrder) {
      throw new NotFoundException('Product order not found');
    }
    // Validate that order items exist
    if (!productOrder.orderItems || productOrder.orderItems.length === 0) {
      throw new BadRequestException('Product order has no items');
    }
    // Get franchise address
    const franchiseAddress = await this.addressService.findByTableIdAndPk(
      TableEnum.MST_FRANCHISES,
      productOrder.franchiseId,
    );
    // Get billing address:
    let billingAddress: IAddress | null = null;
    const memberAddressSnapshot = productOrder.memberAddress;
    if (memberAddressSnapshot.billingAddress) {
      billingAddress = memberAddressSnapshot.billingAddress as IAddress;
    } else if (productOrder.address) {
      billingAddress = memberAddressSnapshot.address as IAddress;
    }
    if (!billingAddress) {
      throw new BadRequestException('Billing address not found for invoice generation');
    }
    // Convert product order to model
    const productModel = this.convertToModel(productOrder, []);
    // Prepare member info
    const memberInfo: IMemberInfo = {
      fullName: productModel.memberName,
      emailId: productOrder.member.emailId,
      contactNumber: productOrder.member.contactNumber,
      businessRegNumber: productOrder.gstNumber,
    };
    // Generate an invoice document using the new product order mapper
    const invoiceDoc = mapProductOrderToInvoiceDocument(
      productModel,
      productOrder.franchise,
      billingAddress,
      franchiseAddress,
      memberInfo,
      [
        'All payments for each item listed in this invoice are non-refundable and non-transferable under any circumstances.',
        `Payment confirms acceptance of ${productOrder.franchise.companyName} terms and service validity conditions.`,
      ],
    );
    const fileName = `invoice-${productModel.memberProductId}.pdf`;
    const relativePath = `${MediaForEnum.DOWNLOADS}/${memberId}/invoices`;
    const destinationFolderPath = `${this.rootFolderPath}/${relativePath}`;
    // CREATE DIRECTORY IF NOT EXISTS (async)
    try {
      await fs.access(destinationFolderPath);
    } catch {
      await fs.mkdir(destinationFolderPath, { recursive: true });
    }
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    // Generate PDF using the InvoicePdfService
    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoiceDoc);
    const base64Buffer = pdfBuffer.toString('base64');
    // Write PDF buffer to destination folder (async)
    await fs.writeFile(destinationPath, pdfBuffer as Uint8Array);
    return {
      filePath: relativePath,
      fileName: fileName,
      buffer: base64Buffer,
    } as IFileModel;
  }

  public async calculateProductTax(
    memberId: number,
    payload: ICalculateProductVariantTaxRequest,
  ): Promise<ICalculateProductVariantTaxResponse> {
    // Verify member exists
    await this.memberService.verifyMember(memberId);
    // Get franchise for products
    const franchise = await this.getProductFranchise();
    // Get addresses
    const addresses = await this.findAddresses(
      franchise[0],
      memberId,
      payload.addressId,
      payload.billingAddressId,
    );
    const memberAddressSnapshot = addresses.memberAddressSnapshot;
    const tempOrderItems = await this.buildOrderItem(payload.items, payload.discountAmount || 0);
    // Add currencyCode to tempOrderItems for tax calculation
    const tempOrderItemsWithCurrency = tempOrderItems.map((item) => ({
      ...item,
      currencyCode: payload.items.find((i) => i.productId === item.productId)?.currency,
    }));
    // Calculate tax for order items
    const orderItemObjs = await this.calculateOrderItemsTax(
      tempOrderItemsWithCurrency,
      franchise[0],
      addresses.franchiseAddress,
      memberAddressSnapshot.billingAddress,
    );
    const totalOrderAmount = orderItemObjs.reduce((acc, item) => acc + item.baseAmount, 0);
    const totalDiscount = orderItemObjs.reduce((acc, item) => acc + item.discountAmount, 0);
    const totalTaxAmount = orderItemObjs.reduce((acc, item) => acc + item.taxAmount, 0);
    const totalAmount = orderItemObjs.reduce((acc, item) => acc + item.totalAmount, 0);
    // Calculate tax for each product variant
    const results: IProductVariantTaxResult[] = [];
    for (const item of orderItemObjs) {
      results.push(<IProductVariantTaxResult>{
        productId: item.productId,
        productVariantId: item.productVariantId,
        currency: payload.items[0].currency,
        orderAmount: item.baseAmount,
        discountAmount: item.discountAmount,
        taxPercentage: item.effectiveTaxRate,
        taxableAmount: item.baseAmount - item.discountAmount,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
        taxObj: item.taxObj,
        invoiceNote: item.invoiceNote,
        isLutApplied: item.isLutApplied,
        jurisdiction: item.jurisdiction,
      });
    }
    return <ICalculateProductVariantTaxResponse>{
      items: results,
      orderAmount: totalOrderAmount,
      taxAmount: totalTaxAmount,
      discountAmount: totalDiscount,
      taxableAmount: totalOrderAmount - totalDiscount,
      totalAmount: totalAmount,
    };
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
      currency: payload.currency,
      transactionType: TransactionType.PRODUCT,
    };
    const taxResult = await this.taxEngineService.calculate(taxInput);
    // Calculate base amounts
    return <ICalculateTaxResponse>{
      orderAmount: taxResult.baseAmount,
      taxAmount: taxResult.taxAmount,
      totalAmount: taxResult.totalAmount,
      discountAmount: taxResult.discount,
      taxType: taxResult.taxType,
      taxMode: taxResult.taxMode,
      taxPercentage: taxResult.taxPercentage,
      taxObj: taxResult.taxObj,
      invoiceNote: taxResult.invoiceNote || null,
      currency: payload.currency,
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
          quantityValue: variant.quantityValue,
          quantityUnit: variant.quantityUnit,
          unitPrice: variantFees.price,
          baseAmount: Number(variantFees.price * item.quantity),
        });
      }
    }
    const orderSubtotal = sumBy(orderItemObjs, 'baseAmount');
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
    adminId: number = null,
  ): Promise<IMemberProduct> {
    // Verify a member exists (with scope for franchise relationship)
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
    const franchise = await this.getProductFranchise();
    const t = await this.sequelize.transaction();
    try {
      const addresses = await this.findAddresses(
        franchise[0],
        memberId,
        obj.addressId,
        obj.billingAddressId,
      );
      const memberAddressSnapshot = addresses.memberAddressSnapshot;
      const tempOrderItem = await this.buildOrderItem(obj.orderItems, obj.discountAmount || 0);
      // Add currencyCode to tempOrderItems for tax calculation
      const tempOrderItemsWithCurrency = tempOrderItem.map((item) => ({
        ...item,
        currencyCode: obj.orderItems.find((i) => i.productId === item.productId)?.currency || 'INR',
      }));
      // Calculate tax for order items
      const orderItemObjs = await this.calculateOrderItemsTax(
        tempOrderItemsWithCurrency,
        franchise[0],
        addresses.franchiseAddress,
        memberAddressSnapshot.billingAddress,
      );
      const totalOrderAmount = orderItemObjs.reduce((acc, item) => acc + item.baseAmount, 0);
      const totalTaxAmount = orderItemObjs.reduce((acc, item) => acc + item.taxAmount, 0);
      const totalAmount = orderItemObjs.reduce((acc, item) => acc + item.totalAmount, 0);
      const totalDiscount = orderItemObjs.reduce((acc, item) => acc + item.discountAmount, 0);
      // Build payment object structure
      const productOrderData: any = {
        memberId,
        franchiseId: franchise[0].id as number,
        paymentModeId: obj.paymentModeId || null,
        addressId: obj.addressId || null,
        billingAddressId: obj.billingAddressId || null,
        transactionId: obj.transactionId || null,
        paymentDate: obj.paymentDate || new Date(),
        paymentStatusId: obj.paymentStatusId,
        promoCode: obj.promoCode || null,
        isTaxApplicable: true,
        currency: obj.orderItems[0].currency,
        refundObj: null,
        paymentGatewayResponse: obj.paymentGatewayResponse || null,
        gstNumber: obj.gstNumber || null,
        memberAddress: memberAddressSnapshot,
        paymentSource: obj.paymentSource,
        subTotalAmount: totalOrderAmount,
        discountAmount: totalDiscount,
        taxAmount: totalTaxAmount,
        totalAmount: totalAmount,
        active: true,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      };
      if (adminId) {
        Object.assign(productOrderData, { createdBy: adminId, modifiedBy: adminId });
      }
      if (obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY) {
        productOrderData.paymentLink = obj.paymentLink;
        productOrderData.gatewayOrderId = obj.gatewayOrderId;
        productOrderData.gatewayProvider = obj.gatewayProvider;
        productOrderData.gatewayPaymentId = obj.gatewayPaymentId;
      }
      const productOrder = await this.memberProductRepository.create(productOrderData, {
        transaction: t,
      });
      // Create order items - add memberProductId to each item
      const orderItemsForCreate = orderItemObjs.map((itemOrder) => ({
        ...itemOrder,
        memberProductId: productOrder.memberProductId,
      }));
      await this.memberProductOrderItemRepository.bulkCreate(orderItemsForCreate as any, {
        transaction: t,
      });
      // Generate invoice number if payment status is PAID and invoiceId is not already set
      if (obj.paymentStatusId === PaymentStatusEnum.PAID && !productOrder.invoiceId) {
        const franchiseDetails = await this.franchiseService.fetchById(franchise[0].id as number);
        const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
          franchise[0].id as number,
          franchiseDetails.financialYear,
          franchiseDetails.franchiseCode,
          BusinessTypeEnum.PRODUCT,
          t,
        );
        productOrder.invoiceId = invoiceNumber;
        await productOrder.save({ transaction: t });
      }
      await t.commit();
      // Fetch the created product order with relationships
      const createdOrder = await this.memberProductRepository.scope('details').findOne({
        where: { memberProductId: productOrder.memberProductId },
      });
      return this.convertToModel(createdOrder!, []);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Regenerate payment link for a product order
   * Only allowed if payment status is not PAID and payment source is not MANUAL
   * @param memberId - Member ID
   * @param productId - Product order ID
   * @returns Updated product order with new payment link
   */
  public async regeneratePaymentLink(memberId: number, productId: number): Promise<IMemberProduct> {
    // Get product order with all details
    const productOrder = await this.memberProductRepository.scope('details').findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
      },
    });
    if (!productOrder) {
      throw new NotFoundException('Product order not found');
    }
    // Validate payment status is not PAID
    if (productOrder.paymentStatusId === PaymentStatusEnum.PAID) {
      throw new BadRequestException(
        'Payment link can only be regenerated for orders with non-PAID status',
      );
    }
    // Validate payment source is not MANUAL
    if (productOrder.paymentSource === PaymentSourceEnum.MANUAL) {
      throw new BadRequestException('Payment link cannot be regenerated for manual payments');
    }
    // Get member
    const member = await this.memberService.verifyMember(memberId);
    // Get franchise for products
    const franchise = await this.getProductFranchise();
    // Resolve gateway to ensure it's valid
    const currency = productOrder.currency;
    const { resolvedGateway, keyId, keySecret, gatewayCode } =
      await this.resolveGatewayAndCredentials(
        franchise[0].id as number,
        currency,
        productOrder.totalAmount,
      );
    // Prepare customer details from member
    const customerDetails = this.prepareCustomerDetails(member);
    // Prepare description from order items
    const orderItems = productOrder.orderItems || [];
    const productNames = orderItems.map((item) => item.productName).join(', ');
    const paymentDescription = productNames
      ? `Payment for products: ${productNames}`
      : `Product Order Payment for Member ID: ${memberId}`;
    // Prepare notes with member ID and product order ID
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      productOrderId: productId.toString(),
      type: 'product',
    };
    // Create payment link using the adapter
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    const paymentLink = await adaptor.createPaymentLink(
      productOrder.totalAmount,
      currency,
      paymentDescription,
      customerDetails,
      paymentNotes,
      {
        keyId,
        keySecret,
      },
    );
    // Update product order with new payment link
    productOrder.paymentLink = paymentLink.short_url;
    productOrder.gatewayProvider = gatewayCode;
    productOrder.gatewayOrderId = paymentLink.id;
    await productOrder.save();
    // Reload product order with all relationships for conversion
    const updatedProductOrder = await this.memberProductRepository.scope('details').findOne({
      where: {
        memberProductId: productId,
        memberId,
      },
    });
    if (!updatedProductOrder) {
      throw new NotFoundException('Product order not found after update');
    }
    // Convert to IMemberProduct and return
    return this.convertToModel(updatedProductOrder, []);
  }

  /**
   * Find order by gateway order ID
   * @param gatewayOrderId - Gateway order ID
   * @returns Order details
   */
  public async findByGatewayOrderId(gatewayOrderId: string): Promise<IMemberProduct> {
    const productOrder = await this.memberProductRepository.scope('details').findOne({
      where: {
        gatewayOrderId: gatewayOrderId,
        active: true,
      },
    });
    if (!productOrder) {
      throw new NotFoundException(`Order not found for gateway order ID: ${gatewayOrderId}`);
    }
    return this.convertToModel(productOrder, []);
  }
}
