import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberPayment } from '../models';
import {
  buildTaxRows,
  BusinessTypeEnum,
  ConfigParam,
  IAddress,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IInvoiceItem,
  IManageMemberPayment,
  IMemberInfo,
  IMemberPayment,
  IMemberPaymentMasterData,
  IPaymentGateway,
  IPaymentLinkResponse,
  IPlanTaxCalculationRequest,
  ITableList,
  mapPaymentToInvoiceDocument,
  MediaForEnum,
  PaymentGatewayEnum,
  PaymentSourceEnum,
  PaymentStatusEnum,
  TableEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, Env, MstFranchise, PaymentValidationUtil } from '@server_1/core';
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
import { ProgramPlanService, ProgramService } from '@server_1/modules/program-plan';
import { TaxEngineService, TaxInput } from '@server_1/modules/tax-engine';
import { FranchisePaymentGatewayService, FranchiseService } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { Sequelize } from 'sequelize-typescript';
import { MemberDietPlanService } from './member-diet-plan.service';
import { promises as fs } from 'fs';
import { find } from 'lodash';

@Injectable()
export class MemberPlanService {
  rootFolderPath = `${Env.persistentStorageAssetPath}`;

  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    private sequelize: Sequelize,
    private readonly appConfigService: AppConfigService,
    private readonly paymentModeService: PaymentModeService,
    private readonly paymentStatusService: PaymentStatusService,
    private readonly programService: ProgramService,
    private readonly programPlanService: ProgramPlanService,
    private readonly addressService: AddressService,
    private readonly taxEngineService: TaxEngineService,
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
    private readonly franchisePaymentGatewayService: FranchisePaymentGatewayService,
    private readonly franchiseService: FranchiseService,
    private readonly paymentGatewayResolverService: PaymentGatewayResolverService,
    private readonly memberDietPlanService: MemberDietPlanService,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly invoiceSequenceService: InvoiceSequenceService,
  ) {}

  /**
   * Load master data for member payment form
   * @param memberId - Member ID
   * @returns Master data including dropdowns, addresses, and tax configuration
   */
  public async loadMasterData(memberId: number): Promise<IMemberPaymentMasterData> {
    const [paymentModes, programs, paymentStatuses, programPlan, addresses] = await Promise.all([
      this.paymentModeService.getDropdownList(),
      this.programService.getProgramList(),
      this.paymentStatusService.getDropdownList(),
      this.programPlanService.getProgramPlanList(),
      this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId),
    ]);
    const taxApplicable = this.appConfigService.getBoolean(ConfigParam.GST_ENABLED, true, false);
    const paymentSource: IDropdownItem[] = Object.values(PaymentSourceEnum).map((source) => ({
      id: source,
      label: source,
      selected: false,
    }));
    return <IMemberPaymentMasterData>{
      paymentMode: paymentModes,
      program: programs,
      paymentStatus: paymentStatuses,
      programPlan: programPlan,
      addresses: addresses as any as IAddress[],
      taxApplicable,
      paymentSource,
    };
  }

  /**
   * Calculate tax for payment form
   * Used by frontend to get real-time tax calculations
   */
  public async calculateTax(
    memberId: number,
    payload: IPlanTaxCalculationRequest,
  ): Promise<ICalculateTaxResponse> {
    // Get member to find a franchise
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get billing address (customer address)
    // Billing address is required for accurate tax calculation
    let billingAddress: IAddress | null = null;
    if (payload.billingAddressId) {
      const addresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.TXN_MEMBER,
        memberId,
      );
      billingAddress = addresses.find((a) => a.addressId === payload.billingAddressId) || null;
    } else if (payload.addressId) {
      const addresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.TXN_MEMBER,
        memberId,
      );
      billingAddress = addresses.find((a) => a.addressId === payload.addressId) || null;
    }
    // Validate billing address is provided when tax is applicable
    if (!billingAddress) {
      throw new BadRequestException(
        'Billing address is required for tax calculation. Please provide billingAddressId or addressId.',
      );
    }
    // Get franchise address (supplier address)
    let franchiseAddress: IAddress | null = null;
    if (member.franchiseId) {
      const franchiseAddresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.MST_FRANCHISES,
        member.franchiseId,
      );
      franchiseAddress =
        franchiseAddresses && franchiseAddresses.length > 0 ? franchiseAddresses[0] : null;
    }
    // Get country and state codes from addresses
    let supplierCountryCode = null;
    let supplierStateCode: string | null = null;
    let customerCountryCode = null;
    let customerStateCode: string | null = null;
    if (franchiseAddress) {
      if (franchiseAddress.countryId) {
        const franchiseCountry = await this.countryService.fetchById(franchiseAddress.countryId);
        supplierCountryCode = franchiseCountry.countryCode;
      }
      if (franchiseAddress.stateId) {
        const franchiseState = await this.stateService.fetchById(franchiseAddress.stateId);
        supplierStateCode = franchiseState.code || null;
      }
    }
    if (billingAddress) {
      if (billingAddress.countryId) {
        const customerCountry = await this.countryService.fetchById(billingAddress.countryId);
        customerCountryCode = customerCountry.countryCode;
      }
      if (billingAddress.stateId) {
        const customerState = await this.stateService.fetchById(billingAddress.stateId);
        customerStateCode = customerState.code || null;
      }
    }
    const programPlan = await this.programPlanService.fetchById(payload.programPlanId);
    const fee: { fees: number; currencyCode: string } = find(programPlan.programPlanFees, {
      currencyCode: payload.currency,
    });
    console.log(programPlan);
    console.log(fee);
    // Calculate base amounts
    // Use tax engine to calculate tax
    const taxInput: TaxInput = {
      baseAmount: fee.fees,
      discountAmount: payload.discountAmount,
      supplierCountryCode,
      supplierStateCode: supplierStateCode || undefined,
      customerCountryCode,
      customerStateCode: customerStateCode || undefined,
      referenceId: 1,
      franchiseId: member.franchiseId,
      currency: payload.currency,
      transactionType: TransactionType.SERVICE,
    };
    const taxResult = await this.taxEngineService.calculate(taxInput);
    // If tax is included in plan fees, adjust calculations
    return <ICalculateTaxResponse>{
      orderAmount: taxResult.baseAmount,
      taxableAmount: taxInput.baseAmount - (taxResult.discount || 0),
      discountAmount: taxResult.discount,
      taxPercentage: taxResult.taxPercentage,
      taxAmount: taxResult.taxAmount,
      totalAmount: taxResult.totalAmount,
      taxObj: taxResult.taxObj,
      taxType: taxResult.taxType,
      taxMode: taxResult.taxMode,
      invoiceNote: taxResult.invoiceNote,
    };
  }

  /**
   * Get all payments for a member
   * @param memberId - Member ID
   * @returns List of member payments
   */
  public async findAll(memberId: number): Promise<ITableList<IMemberPayment>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const { rows, count } = await this.memberPaymentRepository.scope('list').findAndCountAll({
      where: {
        memberId,
        active: true,
      },
      order: [['paymentDate', 'DESC']],
      raw: true,
      nest: true,
    });
    return <ITableList<IMemberPayment>>{
      tableData: rows.map((item: any) => this.convertToModel(item)),
      count,
    };
  }

  /**
   * Get payment by ID
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @returns Payment details
   */
  public async findById(memberId: number, paymentId: number): Promise<IMemberPayment> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const payment = await this.memberPaymentRepository.scope('details').findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
        active: true,
      },
      raw: true,
      nest: true,
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return this.convertToModel(payment);
  }

  /**
   * Create a new payment
   * @param memberId - Member ID
   * @param obj - Payment data
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   * @returns Created payment
   */
  public async create(
    memberId: number,
    obj: IManageMemberPayment,
    requestedIp: string,
    adminId: number = null,
  ): Promise<IMemberPayment> {
    // Verify member exists with the franchise
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
    const t = await this.sequelize.transaction();
    try {
      // Handle address if provided
      const addressId = obj.addressId;
      // Load all member addresses at once
      const addresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.TXN_MEMBER,
        memberId,
      );
      // Resolve selected addresses
      let billingAddressId = obj.billingAddressId;
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
      if (member.franchiseId) {
        const franchiseAddresses = await this.addressService.filterByTableIdAndPk(
          TableEnum.MST_FRANCHISES,
          member.franchiseId,
        );
        franchiseAddress =
          franchiseAddresses && franchiseAddresses.length > 0 ? franchiseAddresses[0] : null;
      }
      const programPlan = await this.programPlanService.fetchById(obj.programPlanId);
      const fees = find(programPlan.programPlanFees, { currencyCode: obj.currency });
      const paymentObj = await this.calculatePaymentObject(
        {
          orderAmount: fees.fees,
          discountAmount: obj.discountAmount || 0,
          currencyCode: obj.currency,
        },
        billingAddress,
        franchiseAddress,
      );
      // Get program plan details to get noOfCycle and noOfDaysInCycle
      const noOfCycle = programPlan.noOfCycle;
      const noOfDaysInCycle = programPlan.noOfDaysInCycle;
      // Create a payment record
      const paymentData: any = {
        memberId,
        franchiseId: member.franchiseId,
        paymentModeId: obj.paymentModeId,
        programPlanId: obj.programPlanId,
        programId: obj.programId,
        addressId: addressId,
        billingAddressId: billingAddressId,
        transactionId: obj.transactionId || null,
        paymentDate: obj.paymentDate,
        paymentStatusId: obj.paymentStatusId,
        promoCode: obj.promoCode || null,
        isTaxApplicable: true,
        refundObj: null,
        paymentGatewayResponse: obj.paymentGatewayResponse || null,
        gstNumber: obj.gstNumber || null,
        memberAddress: memberAddressSnapshot,
        paymentSource: obj.paymentSource,
        orderAmount: paymentObj.orderAmount,
        discountAmount: paymentObj.discountAmount,
        taxAmount: paymentObj.taxAmount,
        totalAmount: paymentObj.totalAmount,
        currency: paymentObj.currency,
        taxType: paymentObj.taxType,
        taxMode: paymentObj.taxMode,
        taxPercentage: paymentObj.taxPercentage,
        isLutApplied: paymentObj.isLutApplied,
        taxObj: paymentObj.taxObj,
        jurisdiction: paymentObj.jurisdiction,
        invoiceNote: paymentObj.invoiceNote,
        noOfCycle: noOfCycle,
        daysInCycle: noOfDaysInCycle,
        active: true,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      };
      if (adminId) {
        Object.assign(paymentData, { createdBy: adminId, modifiedBy: adminId });
      }
      if (obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY) {
        paymentData.paymentLink = obj.paymentLink;
        paymentData.gatewayOrderId = obj.gatewayOrderId;
        paymentData.gatewayProvider = obj.gatewayProvider;
      }
      const payment = await this.memberPaymentRepository.create(paymentData, { transaction: t });
      // Create TxnMemberDietPlan entry using service
      await this.memberDietPlanService.createIfNotExists(
        memberId,
        payment.memberPaymentId,
        noOfCycle,
        noOfDaysInCycle,
        requestedIp,
        adminId,
        t,
      );
      // Generate an invoice number if payment status is PAID and invoiceId is not already set
      if (obj.paymentStatusId === PaymentStatusEnum.PAID && !payment.invoiceId) {
        if (member.franchiseId) {
          const franchiseDetails = await this.franchiseService.fetchById(member.franchiseId);
          const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
            member.franchiseId,
            franchiseDetails.financialYear,
            franchiseDetails.franchiseCode,
            BusinessTypeEnum.SERVICE,
            t,
          );
          payment.invoiceId = invoiceNumber;
          await payment.save({ transaction: t });
        }
      }
      await t.commit();
      // Fetch the created payment with relationships
      const createdPayment = await this.memberPaymentRepository.scope('details').findOne({
        where: { memberPaymentId: payment.memberPaymentId },
        raw: true,
        nest: true,
      });
      return this.convertToModel(createdPayment!);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Convert database model to IMemberPayment interface
   */
  private convertToModel(item: TxnMemberPayment): IMemberPayment {
    return {
      memberPaymentId: item.memberPaymentId,
      memberId: item.memberId,
      memberName: item.member ? `${item.member.firstName} ${item.member.lastName}`.trim() : '',
      paymentModeId: item.paymentModeId,
      paymentMode: item.paymentMode?.paymentMode || '',
      programPlanId: item.programPlanId,
      programPlan: item.programPlan?.plan,
      programId: item.programId,
      program: item.program?.program,
      addressId: item.addressId,
      billingAddressId: item.billingAddressId,
      transactionId: item.transactionId,
      paymentDate: item.paymentDate,
      invoiceId: item.invoiceId,
      paymentStatusId: item.paymentStatusId,
      paymentStatus: item.paymentStatus?.paymentStatus || '',
      promoCode: item.promoCode,
      isTaxApplicable: item.isTaxApplicable,
      isPlanFeesIncludedTax: false,
      refundObj: item.refundObj,
      paymentGatewayResponse: item.paymentGatewayResponse,
      gstNumber: item.gstNumber,
      memberAddress: item.memberAddress,
      paymentSource: item.paymentSource,
      orderAmount: CommonFunctionsUtil.toNumber(item.orderAmount),
      discountAmount: CommonFunctionsUtil.toNumber(item.discountAmount || 0),
      taxAmount: CommonFunctionsUtil.toNumber(item.taxAmount),
      totalAmount: CommonFunctionsUtil.toNumber(item.totalAmount),
      currency: item.currency,
      taxType: item.taxType,
      taxMode: item.taxMode,
      taxPercentage: CommonFunctionsUtil.toNumber(item.taxPercentage),
      isLutApplied: item.isLutApplied,
      taxObj: item.taxObj,
      jurisdiction: item.jurisdiction,
      noOfCycle: item.noOfCycle,
      noOfDaysInCycle: item.daysInCycle,
      deletable: false, // TODO: Add logic to determine if payment can be deleted
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
      gatewayPaymentId: item.gatewayPaymentId,
      paymentLink: item.paymentLink,
      gatewayOrderId: item.gatewayOrderId,
      gatewayProvider: item.gatewayProvider,
    } as IMemberPayment;
  }

  /**
   * Calculate a payment object using the tax engine based on billing address and franchise address
   */
  private async calculatePaymentObject(
    paymentObjInput: {
      orderAmount: number;
      discountAmount: number;
      currencyCode: string;
    },
    billingAddress: IAddress | null,
    franchiseAddress: IAddress | null,
  ): Promise<ICalculateTaxResponse> {
    const orderAmount = paymentObjInput.orderAmount;
    const discountAmount = paymentObjInput.discountAmount;
    const currencyCode = paymentObjInput.currencyCode;
    // Get country and state codes from addresses
    const addressCodes = await PaymentUtil.extractAddressCodes(
      franchiseAddress,
      billingAddress,
      this.countryService,
      this.stateService,
    );
    const supplierCountryCode = addressCodes.supplierCountryCode || '';
    const supplierStateCode = addressCodes.supplierStateCode;
    const customerCountryCode = addressCodes.customerCountryCode || '';
    const customerStateCode = addressCodes.customerStateCode;
    // Use tax engine to calculate tax
    const taxInput: TaxInput = {
      baseAmount: orderAmount,
      discountAmount: discountAmount,
      supplierCountryCode,
      supplierStateCode,
      customerCountryCode,
      customerStateCode,
      referenceId: 1,
      franchiseId: franchiseAddress.pkOfTable,
      currency: currencyCode,
      transactionType: TransactionType.SERVICE,
    };
    const taxResult = await this.taxEngineService.calculate(taxInput);
    return <ICalculateTaxResponse>{
      orderAmount: taxResult.baseAmount,
      discountAmount: taxResult.discount,
      taxAmount: taxResult.taxAmount,
      totalAmount: taxResult.totalAmount,
      currency: currencyCode,
      taxType: taxResult.taxType,
      taxMode: taxResult.taxMode,
      taxPercentage: taxResult.taxPercentage,
      isLutApplied: taxResult.isLutApplied,
      taxObj: taxResult.taxObj,
      jurisdiction: {
        entityCountry: taxResult.entityCountry,
        customerCountry: taxResult.customerCountry,
        placeOfSupply: taxResult.placeOfSupply,
      },
      invoiceNote: taxResult.invoiceNote || null,
    };
  }

  /**
   * Get supported payment gateways for a member based on franchise and currency
   * Uses PaymentGatewayResolverService. Resolve to find supported gateways
   * @param memberId - Member ID
   * @param currencyCode - Currency code
   * @returns List of supported payment gateways
   */
  public async getSupportedPaymentGateways(
    memberId: number,
    currencyCode: string,
  ): Promise<IPaymentGateway[]> {
    // Verify a member exists and get a franchise
    const member = await this.memberRepository.findOne({
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
    if (!member.franchiseId) {
      return [];
    }
    // Get all active gateways for franchise and currency
    // Similar to PaymentGatewayResolverService.resolve() but returns all gateways instead of just one
    const gateways = await this.franchisePaymentGatewayService.findActiveByFranchiseAndCurrency({
      franchiseId: member.franchiseId,
      currency: currencyCode,
    });
    // Transform to response format
    return gateways.map((gateway: any) => {
      // Access paymentGateway from a Sequelize model
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
   * @param memberId - Number
   * @param payload - ICreatePaymentLinkRequest
   * @returns Payment link details
   */
  public async createPaymentLink(
    memberId: number,
    payload: ICreatePaymentLinkRequest,
  ): Promise<IPaymentLinkResponse> {
    // Verify a member exists and get a franchise
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
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
    if (!member.franchiseId) {
      throw new BadRequestException('Member does not have an associated franchise');
    }
    if (payload.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    // Use PaymentGatewayResolverService to find the gateway
    let resolvedGateway;
    try {
      resolvedGateway = await this.paymentGatewayResolverService.resolve({
        franchiseId: member.franchiseId,
        currency: payload.currency,
        isInternational: false, // TODO
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
    // Decrypt credentials TODO
    // const keyId = CryptoUtil.decryptData(credentials.apiKeyEncrypted);
    // const keySecret = CryptoUtil.decryptData(credentials.apiSecretEncrypted);
    const keyId = credentials.apiKeyEncrypted;
    const keySecret = credentials.apiSecretEncrypted;
    // Prepare customer details from member if not provided
    const customerDetails = payload.customer || {
      name: member.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : undefined,
      email: member.emailId || undefined,
      contact: member.contactNumber || undefined,
    };
    // Prepare description
    const paymentDescription = payload.description || `Payment for Member ID: ${memberId}`;
    // Prepare notes with member ID and order type
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      type: 'plan',
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
   * Generate invoice PDF for a member payment using the universal invoice system
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @returns File model with PDF details
   */
  public async generateInvoicePDF(memberId: number, paymentId: number): Promise<IFileModel> {
    // Get payment with all details
    const payment: TxnMemberPayment = await this.memberPaymentRepository.scope('invoice').findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
        active: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    // Get franchise address
    const franchiseAddress = await this.addressService.findByTableIdAndPk(
      TableEnum.MST_FRANCHISES,
      payment.franchiseId,
    );
    // Get billing address:
    let billingAddress: IAddress | null = null;
    const memberAddressSnapshot = payment.memberAddress;
    if (memberAddressSnapshot.billingAddress) {
      billingAddress = memberAddressSnapshot.billingAddress as IAddress;
    } else if (payment.address) {
      billingAddress = memberAddressSnapshot.address as IAddress;
    }
    if (!billingAddress) {
      throw new BadRequestException('Billing address not found for invoice generation');
    }
    // Convert payment to model to get calculated amounts
    const paymentModel = this.convertToModel(payment.get({ plain: true }));
    // Prepare member info
    const memberInfo: IMemberInfo = {
      fullName: paymentModel.memberName,
      emailId: payment.member.emailId,
      contactNumber: payment.member.contactNumber,
      businessRegNumber: payment.gstNumber,
    };
    // Map payment to InvoiceDocument using the universal invoice system
    const invoiceDoc = mapPaymentToInvoiceDocument(
      paymentModel,
      payment.franchise,
      billingAddress,
      franchiseAddress,
      this.buildInvoiceItems(payment),
      memberInfo,
      [
        'Diet consulting services are advisory in nature and not medical treatment.',
        'All payments are non-refundable and non-transferable under any circumstances.',
        'Program is valid only for the registered individual.',
        'Pause up to 20 days may be approved in genuine case.',
        `Payment confirms acceptance of ${payment.franchise.companyName} terms and service validity conditions.`,
      ],
    );
    const fileName = `Invoice-${CommonFunctionsUtil.removeSpecialChar(
      paymentModel.memberName,
      '-',
      false,
    )}-${paymentModel.paymentDate}.pdf`;
    const relativePath = `${MediaForEnum.DOWNLOADS}/${memberId}/invoices`;
    const destinationFolderPath = `${this.rootFolderPath}/${relativePath}`;
    //CREATE DIRECTORY IF NOT EXISTS (async)
    try {
      await fs.access(destinationFolderPath);
    } catch {
      await fs.mkdir(destinationFolderPath, { recursive: true });
    }
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    // Generate PDF using the new InvoicePdfService
    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoiceDoc);
    const base64Buffer = pdfBuffer.toString('base64');
    // Write a PDF buffer to the destination folder (async)
    await fs.writeFile(destinationPath, pdfBuffer as Uint8Array);
    return {
      filePath: relativePath,
      fileName: fileName,
      buffer: base64Buffer,
    } as IFileModel;
  }

  /**
   * Regenerate payment link for a payment
   * Only allowed if payment status is PENDING and payment source is not MANUAL
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @returns Updated payment with new payment link
   */
  public async regeneratePaymentLink(memberId: number, paymentId: number): Promise<IMemberPayment> {
    // Get payment with all details
    const payment = await this.memberPaymentRepository.scope('details').findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
        active: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    // Validate payment status is PENDING
    if (payment.paymentStatusId !== PaymentStatusEnum.PENDING) {
      throw new BadRequestException(
        'Payment link can only be regenerated for payments with PENDING status',
      );
    }
    // Validate payment source is not MANUAL
    if (payment.paymentSource === PaymentSourceEnum.MANUAL) {
      throw new BadRequestException('Payment link cannot be regenerated for manual payments');
    }
    // Get member with franchise
    const member = await this.memberRepository.findOne({
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
    if (!member.franchiseId) {
      throw new BadRequestException('Member does not have an associated franchise');
    }
    // Resolve gateway to ensure it's valid
    const currency = payment.currency;
    let resolvedGateway;
    try {
      resolvedGateway = await this.paymentGatewayResolverService.resolve({
        franchiseId: member.franchiseId,
        currency: currency,
        isInternational: false,
        amount: payment.totalAmount,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to resolve payment gateway',
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
    // Decrypt credentials (if needed)
    const keyId = credentials.apiKeyEncrypted;
    const keySecret = credentials.apiSecretEncrypted;
    // Prepare customer details from member
    const customerDetails = {
      name: member.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : undefined,
      email: member.emailId || undefined,
      contact: member.contactNumber || undefined,
    };
    // Prepare description
    const programName = payment.program || '';
    const planName = payment.programPlan || '';
    const paymentDescription = `Payment for ${programName} - ${planName}`;
    // Prepare notes with member ID and order type
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      paymentId: paymentId.toString(),
      type: 'plan',
    };
    // Create payment link using the adapter
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    const paymentLink = await adaptor.createPaymentLink(
      payment.totalAmount,
      currency,
      paymentDescription,
      customerDetails,
      paymentNotes,
      {
        keyId,
        keySecret,
      },
    );
    // Update payment with new payment link
    payment.paymentLink = paymentLink.short_url;
    payment.gatewayProvider = gatewayCode;
    payment.gatewayOrderId = paymentLink.id;
    await payment.save();
    // Reload payment with all relationships for conversion
    const updatedPayment = await this.memberPaymentRepository.scope('details').findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
      },
    });
    if (!updatedPayment) {
      throw new NotFoundException('Payment not found after update');
    }
    // Convert to IMemberPayment and return
    return this.convertToModel(updatedPayment);
  }

  /**
   * Get supported payment gateways for public checkout (no member required)
   * For franchise SERVICE type (plans)
   * Reuses the same logic as getSupportedPaymentGateways but without member validation
   */
  public async getSupportedPaymentGatewaysForCheckout(
    currencyCode: string,
  ): Promise<IPaymentGateway[]> {
    // Get franchise for services (plans)
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.SERVICE);
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
   * Create payment order for embedded checkout (for plans)
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
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get franchise for services (plans)
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.SERVICE);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for services');
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
    const paymentDescription = payload.description || `Plan Payment for Member ID: ${memberId}`;
    // Prepare notes with member ID and order type
    const paymentNotes = {
      memberId: memberId.toString(),
      franchisePaymentGatewayId: resolvedGateway.franchisePaymentGatewayId.toString(),
      type: 'plan',
      ...payload.notes,
    };
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    // Create order based on a gateway type
    let orderId: string;
    const receipt = `order_${memberId}_${Date.now()}`;
    switch (gatewayCode) {
      case PaymentGatewayEnum.RAZORPAY: {
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
      case PaymentGatewayEnum.STRIPE: {
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
      case PaymentGatewayEnum.TELR: {
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
   * Verify payment after completion (for plans)
   */
  public async verifyPayment(
    memberId: number,
    gatewayCode: string,
    paymentId: string,
    orderId?: string,
    signature?: string,
  ): Promise<{ verified: boolean; paymentDetails?: any }> {
    // Verify a member exists
    const member = await this.memberRepository.findOne({
      where: { memberId: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get franchise for services (plans)
    const franchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.SERVICE);
    if (!franchise || franchise.length === 0) {
      throw new BadRequestException('Franchise not found for services');
    }
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
   * Create a payment order for public checkout (no admin required)
   * Similar to create() but uses system admin ID (0) for public orders
   * @param memberId - Member ID
   * @param obj - Payment data
   * @param requestedIp - Request IP
   * @returns Created payment
   */
  public async createPublicOrder(
    memberId: number,
    obj: IManageMemberPayment,
    requestedIp: string,
  ): Promise<IMemberPayment> {
    return await this.create(memberId, obj, requestedIp, null);
  }

  /**
   * Find order by gateway order ID
   * @param gatewayOrderId - Gateway order ID
   * @returns Order details
   */
  public async findByGatewayOrderId(gatewayOrderId: string): Promise<IMemberPayment> {
    const paymentOrder = await this.memberPaymentRepository.scope('details').findOne({
      where: {
        gatewayOrderId: gatewayOrderId,
        active: true,
      },
      nest: true,
    });
    if (!paymentOrder) {
      throw new NotFoundException(`Order not found for gateway order ID: ${gatewayOrderId}`);
    }
    return this.convertToModel(paymentOrder.get({ plain: true }));
  }

  private buildInvoiceItems(payment: TxnMemberPayment): IInvoiceItem[] {
    const taxType = payment.taxType as TaxTypeEnum;
    const taxMode = payment.taxMode as TaxMode;
    const taxRows = buildTaxRows(payment.taxObj || {}, taxType, taxMode);
    return [
      {
        type: TransactionType.SERVICE,
        description: `Nutrition & Diet Counseling Services`,
        sacCode: this.appConfigService.getString(ConfigParam.DIET_SAC_CODE),
        hsnCode: undefined,
        qty: 1,
        unitPrice: payment.orderAmount,
        amount: payment.orderAmount,
        discount: payment.discountAmount,
        taxPercentage: payment.taxPercentage,
        taxAmount: payment.taxAmount,
        totalAmount: payment.totalAmount,
        taxType: taxType,
        taxMode: taxMode,
        taxRows: taxRows,
      },
    ] as IInvoiceItem[];
  }
}
