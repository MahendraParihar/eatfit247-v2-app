import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberProduct } from '../models';
import {
  BusinessTypeEnum,
  ConfigParam,
  IAddress,
  ICalculateTaxRequest,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IMemberInfo,
  IMemberProduct,
  IMemberProductMasterData,
  IMemberPaymentObject,
  IPaymentLinkResponse,
  ITableList,
  mapPaymentToInvoiceDocument,
  MediaForEnum,
  PaymentSourceEnum,
  TableEnum,
  TransactionType, IBasicMemberProduct,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, Env, MstFranchise } from '@server_1/core';
import {
  AddressService,
  CountryService,
  IFileModel,
  InvoicePdfService,
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
      raw: true,
      nest: true,
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
      raw: true,
      nest: true,
    });
    if (!product) {
      throw new NotFoundException('Member product not found');
    }
    return this.convertToModel(product);
  }

  /**
   * Convert database model to IMemberProduct interface
   */
  private convertToModel(item: any): IMemberProduct {
    const paymentAmounts = this.calculatePaymentAmounts(item.paymentObj, item.isTaxApplicable);
    return <IMemberProduct>{
      memberProductId: item.memberProductId,
      memberId: item.memberId,
      memberName: `${item.member.firstName} ${item.member.lastName}`.trim(),
      paymentModeId: item.paymentModeId,
      paymentMode: item.paymentMode?.paymentMode,
      addressId: item.addressId,
      address: item.address
        ? {
            addressTypeId: item.address.addressTypeId,
            addressType: item.address.addressType,
            country: item.address.country,
            state: item.address.state,
            addressId: item.address.addressId,
            postalAddress: item.address.postalAddress,
            cityVillage: item.address.cityVillage || '',
            pinCode: item.address.pinCode || '',
            stateId: item.address.stateId,
            countryId: item.address.countryId,
          }
        : undefined,
      billingAddressId: item.billingAddressId,
      billingAddress: item.billingAddress
        ? {
            addressTypeId: item.address.addressTypeId,
            addressType: item.address.addressType,
            country: item.address.country,
            state: item.address.state,
            addressId: item.billingAddress.addressId,
            postalAddress: item.billingAddress.postalAddress,
            cityVillage: item.billingAddress.cityVillage || '',
            pinCode: item.billingAddress.pinCode || '',
            stateId: item.billingAddress.stateId,
            countryId: item.billingAddress.countryId,
          }
        : undefined,
      transactionId: item.transactionId,
      paymentDate: item.paymentDate,
      invoiceId: item.invoiceId,
      paymentStatusId: item.paymentStatusId,
      paymentStatus: item.paymentStatus?.paymentStatus,
      promoCode: item.promoCode,
      isTaxApplicable: item.isTaxApplicable,
      paymentObj: item.paymentObj,
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
      // Add calculated payment amounts (for compatibility with invoice generation)
      orderAmount: paymentAmounts.orderAmount,
      discountAmount: paymentAmounts.discountAmount,
      taxAmount: paymentAmounts.taxAmount,
      totalAmount: paymentAmounts.totalAmount,
      products: item.products,
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
      const paymentGateway = (gateway as any).paymentGateway || (gateway as any).PaymentGateway;
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
        addressTypeId: productOrder.billingAddress.addressTypeId,
        addressType: productOrder.billingAddress.addressType.addressType || '',
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
        addressTypeId: productOrder.address.addressTypeId,
        addressType: productOrder.address.addressType.addressType || '',
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
    if (productOrder.paymentObj && (productOrder.paymentObj as any).productName) {
      const productName = (productOrder.paymentObj as any).productName;
      const quantity = (productOrder.paymentObj as any).quantity || 1;
      const size = (productOrder.paymentObj as any).size || '';
      productDescription = `Product Order - ${productName}${size ? ` (${size})` : ''}${quantity > 1 ? ` x${quantity}` : ''}`;
    }
    // Map product order to InvoiceDocument using the universal invoice system
    // Note: We need to convert IMemberProduct to a format compatible with mapPaymentToInvoiceDocument
    // Since mapPaymentToInvoiceDocument expects IMemberPayment, we'll need to adapt it
    // For now, we'll create a compatible structure
    const paymentObj: IMemberPaymentObject = productModel.paymentObj as IMemberPaymentObject;
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

  /**
   * Calculate payment amounts from payment object
   * Reads from the stored payment object structure (user/system sections)
   */
  private calculatePaymentAmounts(
    paymentObj: any,
    isTaxApplicable: boolean,
  ): {
    orderAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    taxObject?: object;
  } {
    // Read from user section if available (new structure), otherwise fallback to old structure
    const userSection = paymentObj?.user;
    const systemSection = paymentObj?.system;
    const pricing = paymentObj?.pricing;
    const orderAmount =
      pricing?.orderAmount || userSection?.orderAmount || paymentObj?.orderAmount || 0;
    const discountAmount =
      pricing?.discountAmount || userSection?.discountAmount || paymentObj?.discountAmount || 0;
    const taxAmount = pricing?.taxAmount || userSection?.taxAmount || paymentObj?.taxAmount || 0;
    const totalAmount =
      pricing?.totalAmount || userSection?.totalAmount || paymentObj?.totalAmount || 0;
    const taxObject =
      paymentObj?.tax?.taxObj ||
      userSection?.taxObj ||
      systemSection?.taxObj ||
      paymentObj?.taxObj ||
      undefined;
    // If using old structure, calculate tax
    if (!userSection && !systemSection && !pricing && isTaxApplicable && !taxObject) {
      const subtotal = orderAmount - discountAmount;
      const taxPercentage =
        paymentObj?.taxPercentage ||
        this.appConfigService.getNumber(ConfigParam.TAX_PERCENTAGE, true, 0);
      const calculatedTaxAmount = (subtotal * taxPercentage) / 100;
      return {
        orderAmount,
        discountAmount,
        taxAmount: calculatedTaxAmount,
        totalAmount: subtotal + calculatedTaxAmount,
        taxObject: {
          percentage: taxPercentage,
          amount: calculatedTaxAmount,
        },
      };
    }
    return {
      orderAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      taxObject,
    };
  }
}

