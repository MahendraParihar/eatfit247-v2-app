import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberProduct, TxnMemberProductOrderItem } from '../models';
import {
  BusinessTypeEnum,
  ConfigParam,
  CurrencyUtil,
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
  IPublicCheckoutOrderResponse,
  IPublicProductOrderRequest,
  IPublicProductTaxCalculationRequest,
  IPublicProductTaxCalculationResponse,
  IPublicVerifyPaymentRequest,
  IPublicVerifyPaymentResponse,
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { promises as fs } from 'fs';
import { find, map, sumBy } from 'lodash';
import { MemberService } from './member.service';
import { CheckoutGatewayService } from './checkout-gateway.service';

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
    private readonly eventEmitter: EventEmitter2,
    private readonly checkoutGatewayService: CheckoutGatewayService,
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
    const orderIds = rows.map((row) => row.memberProductId);
    const shipmentDetails = await this.fetchShipmentsByOrderIds(orderIds);
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
    const shipmentDetails = await this.fetchShipmentsByOrderIds([productId]);
    return this.convertToModel(product, shipmentDetails);
  }

  /**
   * Cross-module lookup of shipments by order id.
   *
   * NestJS module boundary rules (and the project's NX tags) forbid `member`
   * statically importing from `delivery`. We use the project-documented escape
   * hatch — resolve TxnShipment + TxnShipmentTrackingEvent by string model
   * name on the shared Sequelize instance — so the build graph doesn't see a
   * member→delivery edge.
   *
   * Returns a flat IShipment[] (one per shipment) with the latest tracking
   * events attached. convertToModel filters to the order it cares about.
   */
  private async fetchShipmentsByOrderIds(orderIds: number[]): Promise<IShipment[]> {
    if (orderIds.length === 0) return [];

    const shipmentModel = this.sequelize.models['txn_shipments'];
    const trackingModel = this.sequelize.models['txn_shipment_tracking_events'];
    if (!shipmentModel) return [];

    const shipments = (await shipmentModel.findAll({
      where: { order_id: orderIds },
      order: [['shipment_id', 'DESC']],
      raw: true,
    })) as any[];

    if (shipments.length === 0) return [];

    let trackingByShipment: Record<number, any[]> = {};
    if (trackingModel) {
      const shipmentIds = shipments.map((s) => s.shipment_id);
      const events = (await trackingModel.findAll({
        where: { shipment_id: shipmentIds },
        order: [['event_time', 'DESC']],
        raw: true,
      })) as any[];
      trackingByShipment = events.reduce<Record<number, any[]>>((acc, ev) => {
        const sid = ev.shipment_id as number;
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(ev);
        return acc;
      }, {});
    }

    return shipments.map((row) => {
      const events = trackingByShipment[row.shipment_id] ?? [];
      return <IShipment>{
        shipmentId: row.shipment_id,
        orderId: row.order_id,
        shipmentNumber: row.shipment_number,
        courierProviderId: row.courier_provider_id ?? undefined,
        providerAccountId: row.provider_account_id ?? undefined,
        franchiseId: row.franchise_id,
        warehouseId: row.warehouse_id,
        trackingNumber: row.tracking_number ?? undefined,
        trackingUrl: row.tracking_url ?? undefined,
        totalAmount:
          row.total_amount != null ? CommonFunctionsUtil.toNumber(row.total_amount) : undefined,
        currency: row.currency ?? undefined,
        status: row.status,
        metaData: row.meta_data ?? undefined,
        lastError: row.last_error ?? undefined,
        retryCount: row.retry_count,
        nextRetryAt: row.next_retry_at ?? undefined,
        trackingEvents: events.map((e) => ({
          shipmentTrackingEventId: e.tracking_event_id,
          shipmentId: e.shipment_id,
          status: e.internal_status,
          description: e.description,
          eventTime: e.event_time,
          source: e.source,
          createdAt: e.created_at,
        })),
        createdBy: row.created_by,
        modifiedBy: row.modified_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
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
    const orderItemObjs = await Promise.all(
      tempOrderItems.map(async (item) => {
        const taxCalculationResult = await this.calculateTax(
          item.productId,
          franchise,
          {
            orderAmount: item.baseAmount,
            discountAmount: item.discountAmount,
            currency: item.currencyCode,
          },
          // calculateTax takes (billingAddress, franchiseAddress); these were swapped
          billingAddress,
          franchiseAddress,
        );
        return {
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
        };
      }),
    );
    return orderItemObjs;
  }

  /**
   * Convert database model to IMemberProduct interface
   */
  private convertToModel(item: TxnMemberProduct, shipments: IShipment[]): IMemberProduct {
    const productShipments = shipments.filter((s) => s.orderId === item.memberProductId);

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
   * Generate invoice PDF for a member product order using the universal invoice system
   * @param memberId - Member ID
   * @param productId - Product order ID
   * @returns File model with PDF details
   */
  /**
   * @param checkoutSessionId - public checkout only: the record must have been created by
   *   this checkout session (undefined = admin, no restriction; null/empty = nothing)
   */
  public async generateInvoicePDF(
    memberId: number,
    productId: number,
    checkoutSessionId?: string | null,
  ): Promise<IFileModel> {
    if (checkoutSessionId !== undefined && !checkoutSessionId) {
      throw new NotFoundException('Product order not found');
    }
    // Get product order with all details
    const productOrder = await this.memberProductRepository.scope('invoice').findOne({
      where: {
        memberProductId: productId,
        memberId,
        active: true,
        ...(checkoutSessionId ? { checkoutSessionId } : {}),
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
    publicCheckout = false,
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
    const tempOrderItems = await this.buildOrderItem(
      payload.items,
      payload.discountAmount || 0,
      publicCheckout,
    );
    // Add currencyCode to tempOrderItems for tax calculation
    const tempOrderItemsWithCurrency = tempOrderItems.map((item) => ({
      ...item,
      currencyCode: payload.items.find((i) => i.productId === item.productId)?.currency,
    }));
    // Calculate tax for order items
    const pricedItems = await this.calculateOrderItemsTax(
      tempOrderItemsWithCurrency,
      franchise[0],
      addresses.franchiseAddress,
      memberAddressSnapshot.billingAddress,
    );
    // The public preview must show exactly what the order will charge (same per-line rounding)
    const orderItemObjs = publicCheckout
      ? this.roundOrderLines(pricedItems, payload.items[0].currency)
      : pricedItems;
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

  /**
   * @param publicCheckout - the website may only buy active products at an active price
   *   valid today; admin orders keep the previous behaviour.
   */
  private async buildOrderItem(
    orderItems: IMemberProductOrderItemBasic[],
    discountAmount: number,
    publicCheckout = false,
  ) {
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
        if (publicCheckout && !product.active) {
          throw new BadRequestException(`${product.name} is not available`);
        }
        const variantFees: IProductPrice | undefined = publicCheckout
          ? this.findSellablePrice(variant.prices || [], item.currency)
          : find(variant.prices, { currency: item.currency });
        if (!variantFees) {
          throw new BadRequestException(
            `${product.name} (${variant.quantityValue} ${variant.quantityUnit}) is not available in ${item.currency}`,
          );
        }
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
    this.allocateDiscount(orderItemObjs, discountAmount);
    return orderItemObjs;
  }

  /**
   * The active price for the currency that is valid now (variants that were removed have no
   * active price). An end date before the start date means "no end": the admin stores an
   * empty "valid to" as 1970-01-01.
   */
  private findSellablePrice(prices: IProductPrice[], currency: string): IProductPrice | undefined {
    // valid_from / valid_to are calendar dates: compare YYYY-MM-DD (server-local today), so a
    // price is sellable for the whole of its first and last day.
    const toDay = (value: Date | string | null | undefined): string | null =>
      value ? new Date(value).toISOString().slice(0, 10) : null;
    const today = new Date().toLocaleDateString('en-CA');
    return prices.find((p) => {
      const from = toDay(p.validFrom);
      const to = toDay(p.validTo);
      const openEnded = to === null || to <= '1970-01-01' || (from !== null && to < from);
      return (
        (p.currency || '').toUpperCase() === currency.toUpperCase() &&
        p.active !== false &&
        (from === null || from <= today) &&
        (openEnded || to >= today)
      );
    });
  }

  /**
   * Round each line to the currency and derive its total from the rounded parts, so the lines
   * add up exactly to the order total that is charged (public preview and order).
   */
  private roundOrderLines<T extends { unitPrice: number; baseAmount: number; discountAmount: number; taxAmount: number; totalAmount: number }>(
    items: T[],
    currency: string,
  ): T[] {
    const round = (amount: number): number =>
      CurrencyUtil.fromMinor(CurrencyUtil.toMinor(Number(amount) || 0, currency), currency);
    return items.map((item) => {
      const baseAmount = round(item.baseAmount);
      const discountAmount = round(item.discountAmount);
      const taxAmount = round(item.taxAmount);
      return {
        ...item,
        unitPrice: round(item.unitPrice),
        baseAmount,
        discountAmount,
        taxAmount,
        totalAmount: round(baseAmount - discountAmount + taxAmount),
      };
    });
  }

  /** Spread an order-level discount over the lines in proportion to their value. */
  private allocateDiscount(
    orderItems: Array<{ baseAmount: number; discountAmount?: number }>,
    discountAmount: number,
  ): void {
    const orderSubtotal = sumBy(orderItems, 'baseAmount');
    for (const orderItem of orderItems) {
      orderItem.discountAmount = orderSubtotal > 0 ? (orderItem.baseAmount / orderSubtotal) * discountAmount : 0;
    }
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
      const isGatewayPayment = obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY;
      if (isGatewayPayment) {
        // Decision 14: only the gateway sets status, date and ids; the link comes after the save
        Object.assign(productOrderData, {
          paymentStatusId: PaymentStatusEnum.PENDING,
          paymentDate: null,
          transactionId: null,
          paymentModeId: null,
          paymentGatewayResponse: null,
        });
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
      if (isGatewayPayment) {
        // Decision 13: link for exactly the stored total, after the order exists
        await productOrder.reload({ transaction: t });
        const link = await this.checkoutGatewayService.createGatewayPaymentLink({
          franchiseId: franchise[0].id as number,
          currency: productOrder.currency,
          amount: Number(productOrder.totalAmount),
          requestedGatewayId: obj.franchisePaymentGatewayId,
          receipt: `product_${productOrder.memberProductId}`,
          description: `Payment for products: ${orderItemObjs.map((item) => item.productName).join(', ')}`,
          customer: this.prepareCustomerDetails(member),
          notes: {
            memberId: memberId.toString(),
            type: 'product',
            memberProductId: productOrder.memberProductId.toString(),
          },
        });
        await productOrder.update(
          {
            paymentLink: link.shortUrl,
            gatewayOrderId: link.paymentLinkId,
            gatewayProvider: link.gatewayCode,
            franchisePaymentGatewayId: link.franchisePaymentGatewayId,
          },
          { transaction: t },
        );
      }
      // Generate invoice number if payment status is PAID and invoiceId is not already set
      if (productOrder.paymentStatusId === PaymentStatusEnum.PAID && !productOrder.invoiceId) {
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
      if (productOrder.paymentStatusId === PaymentStatusEnum.PAID) {
        this.eventEmitter.emit('order.product.paid', {
          memberProductId: productOrder.memberProductId,
          createdBy: adminId ?? null,
          createdIp: requestedIp,
        });
      }
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
   * Replace a PENDING order's link (e.g. expired): the old link is cancelled at the gateway
   * first so it can't be paid as well, then a new one is created for the stored total.
   */
  public async regeneratePaymentLink(memberId: number, productId: number): Promise<IMemberProduct> {
    const productOrder = await this.memberProductRepository.findOne({
      where: { memberProductId: productId, memberId, active: true },
    });
    if (!productOrder) {
      throw new NotFoundException('Product order not found');
    }
    if (productOrder.paymentStatusId !== PaymentStatusEnum.PENDING) {
      throw new BadRequestException('Payment link can only be regenerated for orders with PENDING status');
    }
    if (productOrder.paymentSource !== PaymentSourceEnum.PAYMENT_GATEWAY) {
      throw new BadRequestException('Payment link cannot be regenerated for manual payments');
    }
    const member = await this.memberService.verifyMember(memberId);
    if (productOrder.gatewayOrderId) {
      const { cancelled } = await this.checkoutGatewayService.cancelGatewayPaymentLink({
        paymentLinkId: this.checkoutGatewayService.requirePaymentLinkId(productOrder.gatewayOrderId),
        gatewayProvider: productOrder.gatewayProvider,
        franchisePaymentGatewayId: productOrder.franchisePaymentGatewayId,
      });
      if (!cancelled) {
        throw new ConflictException('The current link has already been paid; the payment will be confirmed by the gateway.');
      }
    }
    const link = await this.checkoutGatewayService.createGatewayPaymentLink({
      franchiseId: productOrder.franchiseId,
      currency: productOrder.currency,
      amount: Number(productOrder.totalAmount),
      requestedGatewayId: productOrder.franchisePaymentGatewayId ?? undefined,
      receipt: `product_${productId}`,
      description: `Product Order Payment for Member ID: ${memberId}`,
      customer: this.prepareCustomerDetails(member),
      notes: { memberId: memberId.toString(), type: 'product', memberProductId: productId.toString() },
    });
    await productOrder.update({
      paymentLink: link.shortUrl,
      gatewayOrderId: link.paymentLinkId,
      gatewayProvider: link.gatewayCode,
      franchisePaymentGatewayId: link.franchisePaymentGatewayId,
    });
    return this.findById(memberId, productId);
  }

  /** Decision 14: cancel the open link at the gateway; the order becomes FAILED. */
  public async cancelPaymentLink(
    memberId: number,
    productId: number,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberProduct> {
    const productOrder = await this.memberProductRepository.findOne({
      where: { memberProductId: productId, memberId, active: true },
    });
    if (!productOrder) {
      throw new NotFoundException('Product order not found');
    }
    if (
      productOrder.paymentSource !== PaymentSourceEnum.PAYMENT_GATEWAY ||
      productOrder.paymentStatusId !== PaymentStatusEnum.PENDING
    ) {
      throw new BadRequestException('Only a pending payment-gateway order has a link to cancel');
    }
    await this.checkoutGatewayService.cancelRecordPaymentLink({
      gatewayOrderId: productOrder.gatewayOrderId,
      gatewayProvider: productOrder.gatewayProvider,
      franchisePaymentGatewayId: productOrder.franchisePaymentGatewayId,
      requestedIp,
      adminId,
    });
    return this.findById(memberId, productId);
  }

  /**
   * Public product tax preview: master prices, promo applied on the server.
   */
  public async calculatePublicProductTax(
    memberId: number,
    payload: IPublicProductTaxCalculationRequest,
  ): Promise<IPublicProductTaxCalculationResponse> {
    const currency = payload.currency.toUpperCase();
    const items = payload.items.map((item) => ({ ...item, currency }));
    const subtotal = sumBy(await this.buildOrderItem(items, 0, true), 'baseAmount');
    const promo = await this.checkoutGatewayService.applyPromoCode(payload.promoCode, subtotal, currency);
    const tax = await this.calculateProductTax(memberId, {
      items,
      addressId: payload.addressId,
      billingAddressId: payload.billingAddressId,
      discountAmount: promo.discountAmount,
    }, true);
    return { ...tax, promoCode: promo.promoCode, promoMessage: promo.message };
  }

  /**
   * Order-first product checkout. In one transaction: price each variant from
   * mst_product_prices, apply the promo and per-line tax, create the PENDING order and
   * its lines (no payment date), create the gateway order for the stored total and store
   * its id. A gateway failure rolls everything back.
   */
  public async createPublicCheckoutOrder(
    memberId: number,
    obj: IPublicProductOrderRequest,
    requestedIp: string,
    checkoutSessionId: string | null = null,
  ): Promise<IPublicCheckoutOrderResponse> {
    const member = await this.memberService.verifyMember(memberId);
    const franchise = await this.getProductFranchise();
    const addresses = await this.findAddresses(franchise[0], memberId, obj.addressId, obj.billingAddressId);
    const memberAddressSnapshot = addresses.memberAddressSnapshot;
    if (!memberAddressSnapshot.address || !memberAddressSnapshot.billingAddress) {
      throw new BadRequestException('Address does not belong to this member');
    }
    const currency = obj.currency.toUpperCase();
    const items = obj.items.map((item) => ({ ...item, currency }));
    const tempOrderItems = await this.buildOrderItem(items, 0, true);
    const subtotal = sumBy(tempOrderItems, 'baseAmount');
    const promo = await this.checkoutGatewayService.applyPromoCode(obj.promoCode, subtotal, currency);
    this.allocateDiscount(tempOrderItems, promo.discountAmount);
    const pricedItems = await this.calculateOrderItemsTax(
      tempOrderItems.map((item) => ({ ...item, currencyCode: currency })),
      franchise[0],
      addresses.franchiseAddress,
      memberAddressSnapshot.billingAddress,
    );
    // Round each line first, so the stored lines add up to the charged total.
    const orderItemObjs = this.roundOrderLines(pricedItems, currency);
    const round = (amount: number): number =>
      CurrencyUtil.fromMinor(CurrencyUtil.toMinor(Number(amount) || 0, currency), currency);

    const t = await this.sequelize.transaction();
    try {
      const productOrder = await this.memberProductRepository.create(
        {
          memberId,
          franchiseId: franchise[0].id as number,
          paymentModeId: null,
          addressId: obj.addressId,
          billingAddressId: obj.billingAddressId,
          transactionId: null,
          paymentDate: null,
          paymentStatusId: PaymentStatusEnum.PENDING,
          promoCode: promo.promoCode,
          isTaxApplicable: true,
          currency,
          refundObj: null,
          paymentGatewayResponse: null,
          gstNumber: obj.gstNumber || null,
          memberAddress: memberAddressSnapshot,
          paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
          checkoutSessionId,
          subTotalAmount: round(sumBy(orderItemObjs, 'baseAmount')),
          discountAmount: round(sumBy(orderItemObjs, 'discountAmount')),
          taxAmount: round(sumBy(orderItemObjs, 'taxAmount')),
          totalAmount: round(sumBy(orderItemObjs, 'totalAmount')),
          active: true,
          createdIp: requestedIp,
          modifiedIp: requestedIp,
        } as Partial<TxnMemberProduct> as TxnMemberProduct,
        { transaction: t },
      );
      await this.memberProductOrderItemRepository.bulkCreate(
        orderItemObjs.map((item) => ({ ...item, memberProductId: productOrder.memberProductId })) as TxnMemberProductOrderItem[],
        { transaction: t },
      );
      // The gateway is charged the total as stored (DECIMAL-rounded), not the in-memory figure.
      await productOrder.reload({ transaction: t });
      const gateway = await this.checkoutGatewayService.createGatewayOrder({
        franchiseId: franchise[0].id as number,
        currency,
        amount: Number(productOrder.totalAmount),
        requestedGatewayId: obj.franchisePaymentGatewayId,
        receipt: `product_${productOrder.memberProductId}`,
        description: `Payment for products: ${orderItemObjs.map((item) => item.productName).join(', ')}`,
        customer: this.prepareCustomerDetails(member),
        notes: {
          memberId: memberId.toString(),
          type: 'product',
          memberProductId: productOrder.memberProductId.toString(),
        },
      });
      await productOrder.update(
        {
          gatewayOrderId: gateway.gatewayOrderId,
          gatewayProvider: gateway.gatewayCode,
          franchisePaymentGatewayId: gateway.franchisePaymentGatewayId,
        },
        { transaction: t },
      );
      await t.commit();
      const { franchisePaymentGatewayId, ...gatewayPayload } = gateway;
      void franchisePaymentGatewayId;
      const subTotalAmount = Number(productOrder.subTotalAmount);
      const discountAmount = Number(productOrder.discountAmount || 0);
      return {
        recordId: productOrder.memberProductId,
        paymentStatusId: PaymentStatusEnum.PENDING,
        breakdown: {
          currency,
          orderAmount: subTotalAmount,
          promoCode: productOrder.promoCode,
          discountAmount,
          taxableAmount: subTotalAmount - discountAmount,
          taxAmount: Number(productOrder.taxAmount),
          totalAmount: Number(productOrder.totalAmount),
          items: orderItemObjs.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            orderAmount: item.baseAmount,
            discountAmount: item.discountAmount,
            taxableAmount: item.baseAmount - item.discountAmount,
            taxPercentage: item.effectiveTaxRate,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
          })),
        },
        gateway: gatewayPayload,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * After the checkout callback: verify with the order's gateway and confirm if captured.
   */
  public async verifyPublicPayment(
    memberId: number,
    body: IPublicVerifyPaymentRequest,
    requestedIp: string,
  ): Promise<IPublicVerifyPaymentResponse> {
    const productOrder = await this.memberProductRepository.findOne({
      where: { gatewayOrderId: body.orderId, memberId, active: true },
    });
    if (!productOrder) {
      throw new NotFoundException('Order not found');
    }
    const result = await this.checkoutGatewayService.verifyAndConfirm({
      gatewayOrderId: productOrder.gatewayOrderId,
      gatewayProvider: productOrder.gatewayProvider,
      franchisePaymentGatewayId: productOrder.franchisePaymentGatewayId,
      paymentId: body.paymentId,
      signature: body.signature,
      requestedIp,
    });
    await productOrder.reload();
    return {
      verified: productOrder.paymentStatusId === PaymentStatusEnum.PAID,
      recordId: productOrder.memberProductId,
      paymentStatusId: productOrder.paymentStatusId,
      invoiceId: productOrder.invoiceId || null,
      gatewayStatus: result.gatewayStatus,
      message: result.message,
    };
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
    // Public, unauthenticated lookup: never expose the raw gateway entity (email, contact, card) or refunds
    return { ...this.convertToModel(productOrder, []), paymentGatewayResponse: null, refundObj: null, gstNumber: null, createdByUser: null, updatedByUser: null };
  }
}
