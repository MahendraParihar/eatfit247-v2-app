import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  IMemberPaymentUpdateChange,
  IMemberPaymentUpdatePreview,
  IPaymentGateway,
  IPaymentLinkResponse,
  IPlanTaxCalculationRequest,
  IProgramPlan,
  IPublicCheckoutOrderResponse,
  IPublicPlanOrderRequest,
  IPublicPlanTaxCalculationRequest,
  IPublicPlanTaxCalculationResponse,
  IPublicVerifyPaymentRequest,
  IPublicVerifyPaymentResponse,
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
import { CheckoutGatewayService } from './checkout-gateway.service';
import { promises as fs } from 'fs';
import { find } from 'lodash';
import moment from 'moment';

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
    private readonly checkoutGatewayService: CheckoutGatewayService,
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
      const isGatewayPayment = obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY;
      if (isGatewayPayment) {
        // Decision 14: only the gateway sets status, date and ids; the link comes after the save
        Object.assign(paymentData, {
          paymentStatusId: PaymentStatusEnum.PENDING,
          paymentDate: null,
          transactionId: null,
          paymentModeId: null,
          paymentGatewayResponse: null,
        });
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
      if (isGatewayPayment) {
        // Decision 13: link for exactly the stored total, after the record exists
        await payment.reload({ transaction: t });
        const link = await this.checkoutGatewayService.createGatewayPaymentLink({
          franchiseId: member.franchiseId,
          currency: payment.currency,
          amount: Number(payment.totalAmount),
          requestedGatewayId: obj.franchisePaymentGatewayId,
          receipt: `plan_${payment.memberPaymentId}`,
          description: `Payment for ${programPlan.plan}`,
          customer: {
            name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || undefined,
            email: member.emailId || undefined,
            contact: member.contactNumber || undefined,
          },
          notes: {
            memberId: memberId.toString(),
            type: 'plan',
            memberPaymentId: payment.memberPaymentId.toString(),
          },
        });
        await payment.update(
          {
            paymentLink: link.shortUrl,
            gatewayOrderId: link.paymentLinkId,
            gatewayProvider: link.gatewayCode,
            franchisePaymentGatewayId: link.franchisePaymentGatewayId,
          },
          { transaction: t },
        );
      }
      // Generate an invoice number if payment status is PAID and invoiceId is not already set
      if (payment.paymentStatusId === PaymentStatusEnum.PAID && !payment.invoiceId) {
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

  public async previewUpdate(
    memberId: number,
    paymentId: number,
    obj: IManageMemberPayment,
  ): Promise<IMemberPaymentUpdatePreview> {
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

    const draft = await this.buildPaymentDraft(memberId, obj);
    const oldPayment = this.convertToModel(payment.get({ plain: true }));
    const dietPlanImpact = await this.memberDietPlanService.getPaymentPlanLimitImpact(
      memberId,
      paymentId,
      draft.noOfCycle,
      draft.noOfDaysInCycle,
    );
    const changes = this.buildUpdatePreviewChanges(oldPayment, draft, obj);
    const changedFields = changes.filter((change) => change.changed);
    const highlights = [...dietPlanImpact.highlights];
    const warnings = [...dietPlanImpact.warnings];
    const financialChanged = changedFields.some((change) =>
      ['programPlan', 'currency', 'billingAddress', 'orderAmount', 'discountAmount', 'taxAmount', 'totalAmount'].includes(
        change.field,
      ),
    );

    if (payment.invoiceId && financialChanged) {
      warnings.push('This payment already has an invoice. Changing billing or amount values may require finance review.');
    }
    if (payment.paymentStatusId === PaymentStatusEnum.PAID && financialChanged) {
      warnings.push('This payment is already marked as paid. Confirm before changing payment amounts.');
    }
    if (payment.paymentSource !== PaymentSourceEnum.MANUAL && financialChanged) {
      warnings.push('Existing payment gateway link/order may no longer match the updated amount or currency.');
    }

    return {
      memberPaymentId: paymentId,
      requiresConfirmation: changedFields.length > 0 || warnings.length > 0 || highlights.length > 0,
      changes,
      dietPlanImpact,
      highlights,
      warnings,
    };
  }

  public async update(
    memberId: number,
    paymentId: number,
    obj: IManageMemberPayment,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberPayment> {
    const payment = await this.memberPaymentRepository.findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
        active: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const isGatewayRecord = payment.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY;
    // Decision 14: the source of a payment can't be switched
    if (isGatewayRecord && obj.paymentSource !== PaymentSourceEnum.PAYMENT_GATEWAY) {
      throw new BadRequestException(
        'A payment-gateway payment cannot be changed to manual. Record an offline payment as a new manual payment.',
      );
    }
    if (!isGatewayRecord && obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY) {
      throw new BadRequestException('To collect online, create a new payment with the payment gateway.');
    }
    // While its link is open, the amount the customer was asked to pay can't change
    const linkOpen = isGatewayRecord && payment.paymentStatusId !== PaymentStatusEnum.PAID;
    if (linkOpen && this.isFinancialChange(payment, obj)) {
      throw new BadRequestException(
        'This payment has an open payment link. Cancel the link and create a new payment to change the amount.',
      );
    }
    if (!isGatewayRecord) {
      PaymentValidationUtil.validateManualPaymentSource({
        paymentSource: obj.paymentSource,
        paymentModeId: obj.paymentModeId,
        paymentDate: obj.paymentDate,
        paymentStatusId: obj.paymentStatusId,
        transactionId: obj.transactionId,
      });
    }

    const draft = await this.buildPaymentDraft(memberId, obj);
    const t = await this.sequelize.transaction();
    try {
      payment.programId = obj.programId;
      payment.addressId = obj.addressId || null;
      payment.gstNumber = obj.gstNumber || null;
      // Billing can't change while a link is open, so the snapshot only picks up the shipping address
      payment.memberAddress = draft.memberAddressSnapshot;
      payment.modifiedIp = requestedIp;
      payment.modifiedBy = adminId;
      if (isGatewayRecord) {
        // Status, date, transaction, gateway ids and source stay as the gateway set them;
        // while the link is open the stored amounts stay too (they are what the link charges).
        if (!linkOpen) {
          this.applyPaymentDraft(payment, obj, draft);
        }
      } else {
        payment.paymentModeId = obj.paymentModeId;
        payment.transactionId = obj.transactionId || null;
        payment.paymentDate = obj.paymentDate;
        payment.paymentStatusId = obj.paymentStatusId;
        payment.paymentGatewayResponse = obj.paymentGatewayResponse || null;
        payment.paymentSource = obj.paymentSource;
        payment.paymentLink = null;
        payment.gatewayOrderId = null;
        payment.gatewayProvider = null;
        payment.gatewayPaymentId = null;
        this.applyPaymentDraft(payment, obj, draft);
      }

      // Invoice number is never generated or changed during edit — it is issued only on
      // create. Any existing payment.invoiceId is preserved untouched.

      await payment.save({ transaction: t });
      await this.memberDietPlanService.updateLimitsForPayment(
        memberId,
        paymentId,
        linkOpen ? payment.noOfCycle : draft.noOfCycle,
        linkOpen ? payment.daysInCycle : draft.noOfDaysInCycle,
        requestedIp,
        adminId,
        t,
      );
      await t.commit();

      const updatedPayment = await this.memberPaymentRepository.scope('details').findOne({
        where: { memberPaymentId: paymentId, memberId },
        raw: true,
        nest: true,
      });
      if (!updatedPayment) {
        throw new NotFoundException('Payment not found after update');
      }
      return this.convertToModel(updatedPayment);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /** Plan, currency, discount or billing address differ from the stored payment. */
  private isFinancialChange(payment: TxnMemberPayment, obj: IManageMemberPayment): boolean {
    return (
      Number(obj.programPlanId) !== Number(payment.programPlanId) ||
      (obj.currency || '').toUpperCase() !== (payment.currency || '').toUpperCase() ||
      Math.abs(Number(obj.discountAmount || 0) - Number(payment.discountAmount || 0)) > 0.001 ||
      Number(obj.billingAddressId || 0) !== Number(payment.billingAddressId || 0)
    );
  }

  /** The priced fields recomputed from the edit (plan, billing address, discount, tax). */
  private applyPaymentDraft(
    payment: TxnMemberPayment,
    obj: IManageMemberPayment,
    draft: Awaited<ReturnType<MemberPlanService['buildPaymentDraft']>>,
  ): void {
    payment.programPlanId = obj.programPlanId;
    payment.billingAddressId = obj.billingAddressId || null;
    payment.promoCode = obj.promoCode || null;
    payment.memberAddress = draft.memberAddressSnapshot;
    payment.orderAmount = draft.paymentObj.orderAmount;
    payment.discountAmount = draft.paymentObj.discountAmount;
    payment.taxAmount = draft.paymentObj.taxAmount;
    payment.totalAmount = draft.paymentObj.totalAmount;
    payment.currency = draft.paymentObj.currency;
    payment.taxType = draft.paymentObj.taxType;
    payment.taxMode = draft.paymentObj.taxMode;
    payment.taxPercentage = draft.paymentObj.taxPercentage;
    payment.isLutApplied = draft.paymentObj.isLutApplied;
    payment.taxObj = draft.paymentObj.taxObj;
    payment.jurisdiction = draft.paymentObj.jurisdiction;
    payment.noOfCycle = draft.noOfCycle;
    payment.daysInCycle = draft.noOfDaysInCycle;
  }

  private async buildPaymentDraft(memberId: number, obj: IManageMemberPayment): Promise<{
    member: TxnMember;
    programPlan: IProgramPlan;
    paymentObj: ICalculateTaxResponse;
    memberAddressSnapshot: {
      address: IAddress | null;
      billingAddress: IAddress | null;
    };
    noOfCycle: number;
    noOfDaysInCycle: number;
  }> {
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

    const addresses = await this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId);
    const billingAddress =
      (obj.billingAddressId && addresses.find((a) => a.addressId === obj.billingAddressId)) || null;
    const primaryAddress =
      (obj.addressId && addresses.find((a) => a.addressId === obj.addressId)) || null;

    if (billingAddress && !billingAddress.countryId) {
      throw new BadRequestException('Billing address country is required when tax is applicable');
    }

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
    if (!fees) {
      throw new BadRequestException('Selected currency is not configured for this program plan');
    }

    const paymentObj = await this.calculatePaymentObject(
      {
        orderAmount: fees.fees,
        discountAmount: obj.discountAmount || 0,
        currencyCode: obj.currency,
      },
      billingAddress,
      franchiseAddress,
    );

    return {
      member,
      programPlan,
      paymentObj,
      memberAddressSnapshot: {
        address: primaryAddress,
        billingAddress,
      },
      noOfCycle: programPlan.noOfCycle,
      noOfDaysInCycle: programPlan.noOfDaysInCycle,
    };
  }

  private buildUpdatePreviewChanges(
    oldPayment: IMemberPayment,
    draft: {
      programPlan: IProgramPlan;
      paymentObj: ICalculateTaxResponse;
      memberAddressSnapshot: {
        address: IAddress | null;
        billingAddress: IAddress | null;
      };
      noOfCycle: number;
      noOfDaysInCycle: number;
    },
    obj: IManageMemberPayment,
  ): IMemberPaymentUpdateChange[] {
    return [
      this.createPreviewChange('programPlan', 'Plan', oldPayment.programPlan, draft.programPlan.plan),
      this.createPreviewChange(
        'paymentDate',
        'Payment Date',
        this.formatDateLabel(oldPayment.paymentDate),
        this.formatDateLabel(obj.paymentDate),
      ),
      this.createPreviewChange(
        'billingAddress',
        'Billing Address',
        this.formatAddressLabel(oldPayment.memberAddress?.billingAddress),
        this.formatAddressLabel(draft.memberAddressSnapshot.billingAddress),
      ),
      this.createPreviewChange('currency', 'Currency', oldPayment.currency, draft.paymentObj.currency),
      this.createPreviewChange('orderAmount', 'Plan Fees', oldPayment.orderAmount, draft.paymentObj.orderAmount),
      this.createPreviewChange(
        'discountAmount',
        'Discount',
        oldPayment.discountAmount,
        draft.paymentObj.discountAmount,
      ),
      this.createPreviewChange('taxAmount', 'Tax Amount', oldPayment.taxAmount, draft.paymentObj.taxAmount),
      this.createPreviewChange('totalAmount', 'Total Amount', oldPayment.totalAmount, draft.paymentObj.totalAmount),
      this.createPreviewChange('noOfCycle', 'No. of Cycles', oldPayment.noOfCycle, draft.noOfCycle),
      this.createPreviewChange(
        'noOfDaysInCycle',
        'Days in Cycle',
        oldPayment.noOfDaysInCycle,
        draft.noOfDaysInCycle,
      ),
    ];
  }

  private createPreviewChange(
    field: string,
    label: string,
    oldValue: string | number | null,
    newValue: string | number | null,
  ): IMemberPaymentUpdateChange {
    const normalize = (value: string | number | null) => {
      if (typeof value === 'number') {
        return Number(value).toFixed(2);
      }
      return value ?? '';
    };
    return {
      field,
      label,
      oldValue,
      newValue,
      changed: normalize(oldValue) !== normalize(newValue),
    };
  }

  private formatAddressLabel(address: any): string | null {
    if (!address) {
      return null;
    }
    return [address.postalAddress, address.cityVillage, address.pinCode]
      .filter((value) => !!value)
      .join(', ');
  }

  private formatDateLabel(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const parsed = moment(value);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }

  /**
   * Public mapper for report services that hydrate payment rows outside this module.
   */
  public toPaymentModel(item: TxnMemberPayment): IMemberPayment {
    return this.convertToModel(item);
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
   * Generate invoice PDF for a member payment using the universal invoice system
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @returns File model with PDF details
   */
  /**
   * @param checkoutSessionId - public checkout only: the record must have been created by
   *   this checkout session (undefined = admin, no restriction; null/empty = nothing)
   */
  public async generateInvoicePDF(
    memberId: number,
    paymentId: number,
    checkoutSessionId?: string | null,
  ): Promise<IFileModel> {
    if (checkoutSessionId !== undefined && !checkoutSessionId) {
      throw new NotFoundException('Payment not found');
    }
    // Get payment with all details
    const payment: TxnMemberPayment = await this.memberPaymentRepository.scope('invoice').findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
        active: true,
        ...(checkoutSessionId ? { checkoutSessionId } : {}),
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
    )}-${paymentModel.paymentDate ?? 'proforma'}.pdf`;
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
   * Replace a PENDING payment's link (e.g. expired): the old link is cancelled at the gateway
   * first so it can't be paid as well, then a new one is created for the stored total.
   */
  public async regeneratePaymentLink(memberId: number, paymentId: number): Promise<IMemberPayment> {
    const payment = await this.memberPaymentRepository.findOne({
      where: { memberPaymentId: paymentId, memberId, active: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.paymentStatusId !== PaymentStatusEnum.PENDING) {
      throw new BadRequestException('Payment link can only be regenerated for payments with PENDING status');
    }
    if (payment.paymentSource !== PaymentSourceEnum.PAYMENT_GATEWAY) {
      throw new BadRequestException('Payment link cannot be regenerated for manual payments');
    }
    const member = await this.memberRepository.findOne({ where: { memberId } });
    if (!member?.franchiseId) {
      throw new BadRequestException('Member does not have an associated franchise');
    }
    if (payment.gatewayOrderId) {
      const { cancelled } = await this.checkoutGatewayService.cancelGatewayPaymentLink({
        paymentLinkId: this.checkoutGatewayService.requirePaymentLinkId(payment.gatewayOrderId),
        gatewayProvider: payment.gatewayProvider,
        franchisePaymentGatewayId: payment.franchisePaymentGatewayId,
      });
      if (!cancelled) {
        throw new ConflictException('The current link has already been paid; the payment will be confirmed by the gateway.');
      }
    }
    const link = await this.checkoutGatewayService.createGatewayPaymentLink({
      franchiseId: member.franchiseId,
      currency: payment.currency,
      amount: Number(payment.totalAmount),
      requestedGatewayId: payment.franchisePaymentGatewayId ?? undefined,
      receipt: `plan_${payment.memberPaymentId}`,
      description: `Payment for member ${memberId}`,
      customer: {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || undefined,
        email: member.emailId || undefined,
        contact: member.contactNumber || undefined,
      },
      notes: { memberId: memberId.toString(), type: 'plan', memberPaymentId: paymentId.toString() },
    });
    await payment.update({
      paymentLink: link.shortUrl,
      gatewayOrderId: link.paymentLinkId,
      gatewayProvider: link.gatewayCode,
      franchisePaymentGatewayId: link.franchisePaymentGatewayId,
    });
    return this.findById(memberId, paymentId);
  }

  /** Decision 14: cancel the open link at the gateway; the payment becomes FAILED. */
  public async cancelPaymentLink(
    memberId: number,
    paymentId: number,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberPayment> {
    const payment = await this.memberPaymentRepository.findOne({
      where: { memberPaymentId: paymentId, memberId, active: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.paymentSource !== PaymentSourceEnum.PAYMENT_GATEWAY || payment.paymentStatusId !== PaymentStatusEnum.PENDING) {
      throw new BadRequestException('Only a pending payment-gateway payment has a link to cancel');
    }
    await this.checkoutGatewayService.cancelRecordPaymentLink({
      gatewayOrderId: payment.gatewayOrderId,
      gatewayProvider: payment.gatewayProvider,
      franchisePaymentGatewayId: payment.franchisePaymentGatewayId,
      requestedIp,
      adminId,
    });
    return this.findById(memberId, paymentId);
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
   * Public plan tax preview: price from the plan fee, promo applied on the server.
   */
  public async calculatePublicTax(
    memberId: number,
    payload: IPublicPlanTaxCalculationRequest,
  ): Promise<IPublicPlanTaxCalculationResponse> {
    const programPlan = await this.programPlanService.fetchById(payload.programPlanId);
    if (!programPlan.active || !programPlan.isVisibleOnWeb) {
      throw new BadRequestException('This plan is not available');
    }
    const fee = this.findPlanFee(programPlan, payload.currency);
    const promo = await this.checkoutGatewayService.applyPromoCode(
      payload.promoCode,
      Number(fee.fees),
      fee.currencyCode,
    );
    const tax = await this.calculateTax(memberId, {
      programPlanId: payload.programPlanId,
      discountAmount: promo.discountAmount,
      currency: fee.currencyCode,
      addressId: payload.addressId,
      billingAddressId: payload.billingAddressId,
    });
    return { ...tax, promoCode: promo.promoCode, promoMessage: promo.message };
  }

  /**
   * Order-first plan checkout. In one transaction: price from the plan fee, promo and tax,
   * create the PENDING record (no payment date), create the gateway order for the stored
   * total and store its id. A gateway failure rolls the record back.
   */
  public async createPublicCheckoutOrder(
    memberId: number,
    obj: IPublicPlanOrderRequest,
    requestedIp: string,
    checkoutSessionId: string | null = null,
  ): Promise<IPublicCheckoutOrderResponse> {
    const member = await this.memberRepository.findOne({ where: { memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const addresses = await this.addressService.filterByTableIdAndPk(TableEnum.TXN_MEMBER, memberId);
    const primaryAddress = addresses.find((a) => a.addressId === obj.addressId) || null;
    const billingAddress = addresses.find((a) => a.addressId === obj.billingAddressId) || null;
    if (!primaryAddress || !billingAddress) {
      throw new BadRequestException('Address does not belong to this member');
    }
    if (!billingAddress.countryId) {
      throw new BadRequestException('Billing address country is required when tax is applicable');
    }
    let franchiseAddress: IAddress | null = null;
    if (member.franchiseId) {
      const franchiseAddresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.MST_FRANCHISES,
        member.franchiseId,
      );
      franchiseAddress = franchiseAddresses?.[0] || null;
    }
    const programPlan = await this.programPlanService.fetchById(obj.programPlanId);
    // Only plans the website offers can be bought online
    if (!programPlan.active || !programPlan.isVisibleOnWeb) {
      throw new BadRequestException('This plan is not available');
    }
    const fee = this.findPlanFee(programPlan, obj.currency);
    const currency = fee.currencyCode;
    const promo = await this.checkoutGatewayService.applyPromoCode(obj.promoCode, Number(fee.fees), currency);
    const paymentObj = await this.calculatePaymentObject(
      { orderAmount: Number(fee.fees), discountAmount: promo.discountAmount, currencyCode: currency },
      billingAddress,
      franchiseAddress,
    );
    const serviceFranchise = await this.franchiseService.franchiseByBusinessType(BusinessTypeEnum.SERVICE);
    if (!serviceFranchise?.length) {
      throw new BadRequestException('Franchise not found for services');
    }

    const t = await this.sequelize.transaction();
    try {
      const payment = await this.memberPaymentRepository.create(
        {
          memberId,
          franchiseId: member.franchiseId,
          paymentModeId: null,
          programPlanId: obj.programPlanId,
          programId: 1,
          addressId: obj.addressId,
          billingAddressId: obj.billingAddressId,
          transactionId: null,
          paymentDate: null,
          paymentStatusId: PaymentStatusEnum.PENDING,
          promoCode: promo.promoCode,
          isTaxApplicable: true,
          refundObj: null,
          paymentGatewayResponse: null,
          gstNumber: obj.gstNumber || null,
          memberAddress: { address: primaryAddress, billingAddress },
          paymentSource: PaymentSourceEnum.PAYMENT_GATEWAY,
          checkoutSessionId,
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
          noOfCycle: programPlan.noOfCycle,
          daysInCycle: programPlan.noOfDaysInCycle,
          active: true,
          createdIp: requestedIp,
          modifiedIp: requestedIp,
        } as Partial<TxnMemberPayment> as TxnMemberPayment,
        { transaction: t },
      );
      await this.memberDietPlanService.createIfNotExists(
        memberId,
        payment.memberPaymentId,
        programPlan.noOfCycle,
        programPlan.noOfDaysInCycle,
        requestedIp,
        null,
        t,
      );
      // The gateway is charged the total as stored (DECIMAL-rounded), not the in-memory figure.
      await payment.reload({ transaction: t });
      const gateway = await this.checkoutGatewayService.createGatewayOrder({
        franchiseId: serviceFranchise[0].id as number,
        currency,
        amount: Number(payment.totalAmount),
        requestedGatewayId: obj.franchisePaymentGatewayId,
        receipt: `plan_${payment.memberPaymentId}`,
        description: `${programPlan.plan} plan for member ${memberId}`,
        customer: {
          name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || undefined,
          email: member.emailId || undefined,
          contact: member.contactNumber || undefined,
        },
        notes: {
          memberId: memberId.toString(),
          type: 'plan',
          memberPaymentId: payment.memberPaymentId.toString(),
        },
      });
      await payment.update(
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
      return {
        recordId: payment.memberPaymentId,
        paymentStatusId: PaymentStatusEnum.PENDING,
        breakdown: {
          currency,
          orderAmount: Number(payment.orderAmount),
          promoCode: payment.promoCode,
          discountAmount: Number(payment.discountAmount || 0),
          taxableAmount: Number(payment.orderAmount) - Number(payment.discountAmount || 0),
          taxPercentage: Number(payment.taxPercentage || 0),
          taxAmount: Number(payment.taxAmount),
          totalAmount: Number(payment.totalAmount),
          taxType: payment.taxType as TaxTypeEnum,
          taxMode: payment.taxMode as TaxMode,
          taxObj: payment.taxObj,
        },
        gateway: gatewayPayload,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * After the checkout callback: verify with the record's gateway and confirm if captured.
   * Never trusts the browser; the webhook remains the backstop.
   */
  public async verifyPublicPayment(
    memberId: number,
    body: IPublicVerifyPaymentRequest,
    requestedIp: string,
  ): Promise<IPublicVerifyPaymentResponse> {
    const payment = await this.memberPaymentRepository.findOne({
      where: { gatewayOrderId: body.orderId, memberId, active: true },
    });
    if (!payment) {
      throw new NotFoundException('Order not found');
    }
    const result = await this.checkoutGatewayService.verifyAndConfirm({
      gatewayOrderId: payment.gatewayOrderId,
      gatewayProvider: payment.gatewayProvider,
      franchisePaymentGatewayId: payment.franchisePaymentGatewayId,
      paymentId: body.paymentId,
      signature: body.signature,
      requestedIp,
    });
    await payment.reload();
    return {
      verified: payment.paymentStatusId === PaymentStatusEnum.PAID,
      recordId: payment.memberPaymentId,
      paymentStatusId: payment.paymentStatusId,
      invoiceId: payment.invoiceId || null,
      gatewayStatus: result.gatewayStatus,
      message: result.message,
    };
  }

  private findPlanFee(programPlan: IProgramPlan, currency: string): { fees: number; currencyCode: string } {
    const code = (currency || '').toUpperCase();
    const fee = (programPlan.programPlanFees || []).find((f) => (f.currencyCode || '').toUpperCase() === code);
    if (!fee) {
      throw new BadRequestException(`This plan is not available in ${currency}`);
    }
    return fee;
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
    // Public, unauthenticated lookup: never expose the raw gateway entity (email, contact, card) or refunds
    return { ...this.convertToModel(paymentOrder.get({ plain: true })), paymentGatewayResponse: null, refundObj: null, gstNumber: null, createdByUser: null, updatedByUser: null };
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
