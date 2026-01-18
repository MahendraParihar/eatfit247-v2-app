import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberPayment } from '../models';
import {
  ConfigParam,
  IAddress,
  ICalculateTaxRequest,
  ICalculateTaxResponse,
  ICreatePaymentLinkRequest,
  IDropdownItem,
  IManageMemberPayment,
  IMemberPayment,
  IMemberPaymentMasterData,
  IMemberPaymentObject,
  IPaymentLinkResponse,
  ITableList,
  mapPaymentToInvoiceDocument,
  MediaForEnum,
  IMemberInfo,
  PaymentSourceEnum,
  PaymentStatusEnum,
  TableEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, Env, MstFranchise } from '@server_1/core';
import {
  AddressService,
  CountryService,
  IFileModel,
  InvoicePdfService,
  PaymentModeService,
  PaymentStatusService,
  PdfService,
  StateService,
} from '@server_1/platform';
import { ProgramPlanService, ProgramService } from '@server_1/modules/program-plan';
import { TaxEngineService, TaxInput } from '@server_1/modules/tax-engine';
import { FranchisePaymentGatewayService } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { Sequelize } from 'sequelize-typescript';
import { MemberDietPlanService } from './member-diet-plan.service';
import fs from 'fs';

@Injectable()
export class MemberPaymentService {
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
    private readonly paymentGatewayResolverService: PaymentGatewayResolverService,
    private readonly memberDietPlanService: MemberDietPlanService,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly pdfService: PdfService,
    private readonly invoicePdfService: InvoicePdfService,
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
    payload: ICalculateTaxRequest,
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
    if (payload.isTaxApplicable && !billingAddress) {
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
    // Calculate base amounts
    let systemOrderAmount = payload.orderAmount;
    let systemDiscountAmount = payload.discountAmount;
    let baseAmountForTax = systemOrderAmount;
    // Handle isPlanFeesIncludedTax - extract base amount if tax is included
    if (payload.isTaxApplicable && payload.isPlanFeesIncludedTax) {
      // First, get tax percentage to extract the base amount
      const tempTaxInput: TaxInput = {
        baseAmount: systemOrderAmount,
        discountAmount: 0,
        isTaxApplicable: true,
        supplierCountryCode,
        supplierStateCode: supplierStateCode || undefined,
        customerCountryCode,
        customerStateCode: customerStateCode || undefined,
        currency: payload.currencyCode,
        transactionType: TransactionType.SERVICE,
      };
      const tempTaxResult = await this.taxEngineService.calculate(tempTaxInput);
      if (tempTaxResult.taxPercentage > 0) {
        // Extract base amount from order amount that includes tax
        baseAmountForTax = systemOrderAmount / (1 + tempTaxResult.taxPercentage / 100);
      }
    }
    // Use tax engine to calculate tax
    const taxInput: TaxInput = {
      baseAmount: payload.isPlanFeesIncludedTax ? baseAmountForTax : systemOrderAmount,
      discountAmount: systemDiscountAmount,
      isTaxApplicable: payload.isTaxApplicable,
      supplierCountryCode,
      supplierStateCode: supplierStateCode || undefined,
      customerCountryCode,
      customerStateCode: customerStateCode || undefined,
      currency: payload.currencyCode,
      transactionType: TransactionType.SERVICE,
    };
    const taxResult = await this.taxEngineService.calculate(taxInput);
    // Calculate final amounts
    let taxAmount = taxResult.taxAmount;
    let totalAmount = taxResult.totalAmount;
    // If tax is included in plan fees, adjust calculations
    if (payload.isTaxApplicable && payload.isPlanFeesIncludedTax && taxResult.taxPercentage > 0) {
      const extractedTax = systemOrderAmount - baseAmountForTax;
      const discountedBase = baseAmountForTax - systemDiscountAmount;
      taxAmount = extractedTax;
      totalAmount = discountedBase + extractedTax;
    }
    return <ICalculateTaxResponse>{
      taxPercentage: taxResult.taxPercentage,
      taxAmount,
      totalAmount,
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
    adminId: number,
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
    if (obj.orderAmount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    // Validate mandatory fields for MANUAL payment source
    if (obj.paymentSource === PaymentSourceEnum.MANUAL) {
      if (!obj.paymentModeId) {
        throw new BadRequestException('Payment Mode is required for MANUAL payment source');
      }
      if (!obj.paymentDate) {
        throw new BadRequestException('Payment Date is required for MANUAL payment source');
      }
      if (!obj.paymentStatusId) {
        throw new BadRequestException('Payment Status is required for MANUAL payment source');
      }
      if (!obj.transactionId || obj.transactionId.trim() === '') {
        throw new BadRequestException('Transaction ID is required for MANUAL payment source');
      }
    }
    const t = await this.sequelize.transaction();
    try {
      // Handle address if provided
      const addressId = obj.addressId;
      // Handle billing address if provided
      let billingAddressId = obj.billingAddressId;
      const addresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.TXN_MEMBER,
        memberId,
      );
      let billingAddress: IAddress =
        addresses.find((a) => a.addressId === billingAddressId) || null;
      // Validate billing address country if the billing address exists and tax is applicable
      if (billingAddress && obj.isTaxApplicable && !billingAddress.countryId) {
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
      // Calculate payment object using tax engine
      const paymentObj = await this.calculatePaymentObject(
        {
          orderAmount: obj.orderAmount,
          discountAmount: obj.discountAmount,
          currencyCode: obj.currencyCode,
          isPlanFeesIncludedTax: obj.isPlanFeesIncludedTax,
        },
        obj.isTaxApplicable,
        billingAddress,
        franchiseAddress,
      );
      // Create a payment record
      const paymentData: any = {
        memberId,
        franchiseId: member.franchiseId || null,
        paymentModeId: obj.paymentModeId,
        programPlanId: obj.programPlanId,
        programId: obj.programId,
        addressId: addressId,
        billingAddressId: billingAddressId,
        transactionId: obj.transactionId || null,
        paymentDate: obj.paymentDate,
        paymentStatusId: obj.paymentStatusId,
        promoCode: obj.promoCode || null,
        isTaxApplicable: obj.isTaxApplicable,
        paymentObj: paymentObj,
        refundObj: null,
        paymentGatewayResponse: null,
        gstNumber: obj.gstNumber || null,
        paymentSource: obj.paymentSource,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      };
      if (obj.paymentSource === PaymentSourceEnum.PAYMENT_GATEWAY) {
        paymentData.paymentLink = obj.paymentLink;
        paymentData.gatewayOrderId = obj.gatewayOrderId;
        paymentData.gatewayProvider = obj.gatewayProvider;
      }
      const payment = await this.memberPaymentRepository.create(paymentData, { transaction: t });
      // If payment is successfully created with PAID status, create TxnMemberDietPlan entry
      if (obj.paymentStatusId === PaymentStatusEnum.PAID && obj.programPlanId) {
        // Get program plan details to get noOfCycle and noOfDaysInCycle
        let noOfCycle = obj.noOfCycle;
        let noOfDaysInCycle = obj.noOfDaysInCycle;
        // If not available in paymentObj, fetch from the program plan
        if (!noOfCycle || !noOfDaysInCycle) {
          const programPlan = await this.programPlanService.fetchById(obj.programPlanId);
          noOfCycle = programPlan.noOfCycle;
          noOfDaysInCycle = programPlan.noOfDaysInCycle;
        }
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
   * Update an existing payment
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @param obj - Updated payment data
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   * @returns Updated payment
   */
  public async update(
    memberId: number,
    paymentId: number,
    obj: IManageMemberPayment,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberPayment> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Find existing payment
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
    // Validate mandatory fields for MANUAL payment source
    const paymentSource =
      obj.paymentSource !== undefined ? obj.paymentSource : (payment as any).paymentSource;
    if (paymentSource === PaymentSourceEnum.MANUAL) {
      const paymentModeId =
        obj.paymentModeId !== undefined ? obj.paymentModeId : payment.paymentModeId;
      const paymentDate = obj.paymentDate !== undefined ? obj.paymentDate : payment.paymentDate;
      const paymentStatusId =
        obj.paymentStatusId !== undefined ? obj.paymentStatusId : payment.paymentStatusId;
      const transactionId =
        obj.transactionId !== undefined ? obj.transactionId : payment.transactionId;
      if (!paymentModeId) {
        throw new BadRequestException('Payment Mode is required for MANUAL payment source');
      }
      if (!paymentDate) {
        throw new BadRequestException('Payment Date is required for MANUAL payment source');
      }
      if (!paymentStatusId) {
        throw new BadRequestException('Payment Status is required for MANUAL payment source');
      }
      if (!transactionId || (typeof transactionId === 'string' && transactionId.trim() === '')) {
        throw new BadRequestException('Transaction ID is required for MANUAL payment source');
      }
    }
    const t = await this.sequelize.transaction();
    try {
      // Handle address updates if provided
      let addressId = obj.addressId !== undefined ? obj.addressId : payment.addressId;
      // Handle billing address updates if provided
      const addresses = await this.addressService.filterByTableIdAndPk(
        TableEnum.TXN_MEMBER,
        memberId,
      );
      let billingAddress: IAddress =
        addresses.find((a) => a.addressId === obj.billingAddressId) || null;
      // Validate billing address country if the billing address exists and tax is applicable
      if (billingAddress && obj.isTaxApplicable && !billingAddress.countryId) {
        throw new BadRequestException('Billing address country is required when tax is applicable');
      }
      // Get franchise address for GST calculation
      const memberWithFranchise = await this.memberRepository.scope('details').findOne({
        where: { memberId },
        include: [
          {
            model: MstFranchise,
            as: 'franchise',
            required: false,
          },
        ],
      });
      let franchiseAddress: IAddress | null = null;
      if (memberWithFranchise?.franchiseId) {
        const franchiseAddresses = await this.addressService.filterByTableIdAndPk(
          TableEnum.MST_FRANCHISES,
          memberWithFranchise.franchiseId,
        );
        franchiseAddress =
          franchiseAddresses && franchiseAddresses.length > 0 ? franchiseAddresses[0] : null;
      }
      // Update payment record
      const updateData: any = {
        franchiseId: memberWithFranchise?.franchiseId || null,
        paymentModeId: obj.paymentModeId !== undefined ? obj.paymentModeId : payment.paymentModeId,
        programPlanId: obj.programPlanId !== undefined ? obj.programPlanId : payment.programPlanId,
        programId: obj.programId !== undefined ? obj.programId : payment.programId,
        addressId: addressId || null,
        billingAddressId: obj.billingAddressId,
        transactionId:
          obj.transactionId !== undefined ? obj.transactionId || null : payment.transactionId,
        paymentDate: obj.paymentDate !== undefined ? obj.paymentDate : payment.paymentDate,
        paymentStatusId:
          obj.paymentStatusId !== undefined ? obj.paymentStatusId : payment.paymentStatusId,
        promoCode: obj.promoCode !== undefined ? obj.promoCode || null : payment.promoCode,
        isTaxApplicable:
          obj.isTaxApplicable !== undefined ? obj.isTaxApplicable : payment.isTaxApplicable,
        gstNumber: obj.gstNumber !== undefined ? obj.gstNumber : payment.gstNumber,
        modifiedBy: adminId,
        modifiedIp: requestedIp,
      };
      // Update payment source if provided
      if ((obj as any).paymentSource !== undefined) {
        updateData.paymentSource = (obj as any).paymentSource;
      }
      await payment.update(updateData, { transaction: t });
      // Check if payment status is being updated to PAID
      const newPaymentStatusId =
        obj.paymentStatusId !== undefined ? obj.paymentStatusId : payment.paymentStatusId;
      const oldPaymentStatusId = payment.paymentStatusId;
      const programPlanId =
        obj.programPlanId !== undefined ? obj.programPlanId : payment.programPlanId;
      // If payment status changed to PAID, create TxnMemberDietPlan entry if it doesn't exist
      if (
        newPaymentStatusId === PaymentStatusEnum.PAID &&
        oldPaymentStatusId !== PaymentStatusEnum.PAID &&
        programPlanId
      ) {
        // Get program plan details to get noOfCycle and noOfDaysInCycle
        let noOfCycle = 1;
        let noOfDaysInCycle = 1;
        try {
          const programPlan = await this.programPlanService.fetchById(programPlanId);
          noOfCycle = programPlan.noOfCycle || 1;
          noOfDaysInCycle = programPlan.noOfDaysInCycle || 1;
        } catch (error) {
          // If program plan not found, use defaults
          noOfCycle = 1;
          noOfDaysInCycle = 1;
        }
        // Create TxnMemberDietPlan entry using service
        await this.memberDietPlanService.createIfNotExists(
          memberId,
          paymentId,
          noOfCycle,
          noOfDaysInCycle,
          requestedIp,
          adminId,
          t,
        );
      }
      await t.commit();
      // Fetch the updated payment with relationships
      const updatedPayment = await this.memberPaymentRepository.scope('details').findOne({
        where: { memberPaymentId: paymentId },
        raw: true,
        nest: true,
      });
      return this.convertToModel(updatedPayment!);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete (soft delete) a payment
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   */
  public async delete(
    memberId: number,
    paymentId: number,
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
    // Find payment
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
    // Soft delete
    await payment.update({
      active: false,
      modifiedBy: adminId,
      modifiedIp: requestedIp,
    });
  }

  /**
   * Convert database model to IMemberPayment interface
   */
  private convertToModel(item: any): IMemberPayment {
    const paymentAmounts = this.calculatePaymentAmounts(item.paymentObj, item.isTaxApplicable);
    return <IMemberPayment>{
      memberPaymentId: item.memberPaymentId,
      memberId: item.memberId,
      memberName: item.member ? `${item.member.firstName} ${item.member.lastName}`.trim() : '',
      paymentModeId: item.paymentModeId,
      paymentMode: item.paymentMode?.paymentMode || '',
      programPlanId: item.programPlanId,
      programPlan: item.programPlan?.plan || '',
      programId: item.programId,
      program: item.program?.program || '',
      addressId: item.addressId,
      address: item.address
        ? {
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
      paymentStatus: item.paymentStatus?.paymentStatus || '',
      promoCode: item.promoCode,
      isTaxApplicable: item.isTaxApplicable,
      paymentObj: item.paymentObj,
      refundObj: item.refundObj,
      paymentGatewayResponse: item.paymentGatewayResponse,
      gstNumber: item.gstNumber,
      orderAmount: paymentAmounts.orderAmount,
      discountAmount: paymentAmounts.discountAmount,
      taxAmount: paymentAmounts.taxAmount,
      totalAmount: paymentAmounts.totalAmount,
      taxObject: paymentAmounts.taxObject,
      noOfCycle: item.paymentObj?.noOfCycle || 0,
      noOfDaysInCycle: item.paymentObj?.noOfDaysInCycle || 0,
      currentCycleNo: item.paymentObj?.currentCycleNo,
      currentDayNo: item.paymentObj?.currentDayNo,
      deletable: false, // TODO: Add logic to determine if payment can be deleted
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
      gatewayPaymentId: item.gatewayPaymentId,
      paymentLink: item.paymentLink,
      gatewayOrderId: item.gatewayOrderId,
      gatewayProvider: item.gatewayProvider,
    };
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
    const orderAmount = userSection?.orderAmount || paymentObj?.orderAmount || 0;
    const discountAmount = userSection?.discountAmount || paymentObj?.discountAmount || 0;
    const taxAmount = userSection?.taxAmount || paymentObj?.taxAmount || 0;
    const totalAmount = userSection?.totalAmount || paymentObj?.totalAmount || 0;
    const taxObject =
      userSection?.taxObj || systemSection?.taxObj || paymentObj?.taxObj || undefined;
    // If using old structure, calculate tax
    if (!userSection && !systemSection && isTaxApplicable && !taxObject) {
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

  /**
   * Calculate a payment object using the tax engine based on billing address and franchise address
   */
  private async calculatePaymentObject(
    paymentObjInput: {
      orderAmount: number;
      discountAmount: number;
      currencyCode: string;
      isPlanFeesIncludedTax: boolean;
    },
    isTaxApplicable: boolean,
    billingAddress: IAddress | null,
    franchiseAddress: IAddress | null,
  ): Promise<IMemberPaymentObject> {
    const orderAmount = paymentObjInput.orderAmount;
    const discountAmount = paymentObjInput.discountAmount;
    const currencyCode = paymentObjInput.currencyCode;
    const isPlanFeesIncludedTax = paymentObjInput.isPlanFeesIncludedTax;
    // Get country and state codes from addresses
    let supplierCountryCode = '';
    let supplierStateCode: string | null = null;
    let customerCountryCode = '';
    let customerStateCode: string | null = null;
    if (franchiseAddress) {
      // Get franchise country code
      if (franchiseAddress.countryId) {
        const franchiseCountry = await this.countryService.fetchById(franchiseAddress.countryId);
        supplierCountryCode = franchiseCountry.countryCode;
      }
      // Get franchise state code
      if (franchiseAddress.stateId) {
        const franchiseState = await this.stateService.fetchById(franchiseAddress.stateId);
        supplierStateCode = franchiseState.code;
      }
    }
    if (billingAddress) {
      // Get customer country code
      if (billingAddress.countryId) {
        const customerCountry = await this.countryService.fetchById(billingAddress.countryId);
        customerCountryCode = customerCountry.countryCode;
      }
      // Get customer state code
      if (billingAddress.stateId) {
        const customerState = await this.stateService.fetchById(billingAddress.stateId);
        customerStateCode = customerState.code;
      }
    }
    // Calculate base amounts
    let systemOrderAmount = orderAmount;
    let systemDiscountAmount = discountAmount;
    let systemSubtotal = systemOrderAmount - systemDiscountAmount;
    let baseAmountForTax = systemSubtotal;
    // Handle isPlanFeesIncludedTax - extract base amount if tax is included
    if (isTaxApplicable && isPlanFeesIncludedTax) {
      // We need to know the tax percentage first to extract the base amount
      // For now, use tax engine to get tax percentage, then recalculate
      const tempTaxInput: TaxInput = {
        baseAmount: systemOrderAmount,
        discountAmount: 0,
        isTaxApplicable: true,
        supplierCountryCode,
        supplierStateCode,
        customerCountryCode,
        customerStateCode,
        currency: currencyCode,
        transactionType: TransactionType.SERVICE,
      };
      const tempTaxResult = await this.taxEngineService.calculate(tempTaxInput);
      if (tempTaxResult.taxPercentage > 0) {
        // Extract base amount from order amount that includes tax
        baseAmountForTax = systemOrderAmount / (1 + tempTaxResult.taxPercentage / 100);
        systemSubtotal = baseAmountForTax - systemDiscountAmount;
      }
    }
    // Use tax engine to calculate tax
    const taxInput: TaxInput = {
      baseAmount: isPlanFeesIncludedTax ? baseAmountForTax : systemOrderAmount,
      discountAmount: systemDiscountAmount,
      isTaxApplicable,
      supplierCountryCode,
      supplierStateCode,
      customerCountryCode,
      customerStateCode,
      currency: currencyCode,
      transactionType: TransactionType.SERVICE,
    };
    const taxResult = await this.taxEngineService.calculate(taxInput);
    // Calculate system amounts
    let systemTaxAmount = taxResult.taxAmount;
    let systemTotalAmount = taxResult.totalAmount;
    // If tax is included in plan fees, adjust calculations
    if (isTaxApplicable && isPlanFeesIncludedTax && taxResult.taxPercentage > 0) {
      const extractedTax = systemOrderAmount - baseAmountForTax;
      const discountedBase = baseAmountForTax - systemDiscountAmount;
      systemTaxAmount = extractedTax;
      systemTotalAmount = discountedBase + extractedTax;
    }
    // Calculate user amounts (same as a system for now, can be converted later)
    const userOrderAmount = systemOrderAmount;
    const userDiscountAmount = systemDiscountAmount;
    const userTaxAmount = systemTaxAmount;
    const userTotalAmount = systemTotalAmount;
    return <IMemberPaymentObject>{
      currency: currencyCode,
      pricing: {
        orderAmount: userOrderAmount,
        discountAmount: userDiscountAmount,
        taxAmount: userTaxAmount,
        totalAmount: userTotalAmount,
      },
      tax: {
        taxType: taxResult.taxType,
        taxMode: taxResult.taxMode,
        taxPercentage: taxResult.taxPercentage,
        taxAmount: userTaxAmount,
        isTaxIncludedInPrice: isPlanFeesIncludedTax,
        isLutApplied: taxResult.isLutApplied,
        taxObj: taxResult.taxObj,
      },
      jurisdiction: {
        entityCountry: taxResult.entityCountry,
        customerCountry: taxResult.customerCountry,
        placeOfSupply: taxResult.placeOfSupply,
      },
      invoice: {
        note: taxResult.invoiceNote || null,
      },
      calculationVersion: '',
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
   * Generate invoice PDF for a member payment using the universal invoice system
   * @param memberId - Member ID
   * @param paymentId - Payment ID
   * @returns File model with PDF details
   */
  public async generateInvoicePDF(memberId: number, paymentId: number): Promise<IFileModel> {
    // Get payment with all details
    const payment = await this.memberPaymentRepository.scope('details').findOne({
      where: {
        memberPaymentId: paymentId,
        memberId,
        active: true,
      },
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: true,
          include: [
            {
              model: MstFranchise,
              as: 'franchise',
              required: false,
            },
          ],
        },
      ],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    // Get member with franchise
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
    if (!member.franchiseId) {
      throw new BadRequestException('Member does not have an associated franchise');
    }
    // Get franchise address
    const franchiseAddress = await this.addressService.findByTableIdAndPk(
      TableEnum.MST_FRANCHISES,
      member.franchiseId,
    );
    // Get billing address - use from a payment object if available, otherwise use address
    let billingAddress: IAddress | null = null;
    if (payment.billingAddress) {
      billingAddress = {
        addressId: payment.billingAddress.addressId,
        addressName: payment.billingAddress.addressName,
        postalAddress: payment.billingAddress.postalAddress,
        cityVillage: payment.billingAddress.cityVillage,
        stateId: payment.billingAddress.stateId,
        state: payment.billingAddress.state?.state || '',
        countryId: payment.billingAddress.countryId,
        country: payment.billingAddress.country.country || '',
        countryCode: payment.billingAddress.country.countryCode || '',
        pinCode: payment.billingAddress.pinCode,
        addressTypeId: payment.billingAddress.addressTypeId,
        addressType: payment.billingAddress.addressType.addressType || '',
      } as IAddress;
    } else if (payment.address) {
      billingAddress = {
        addressId: payment.address.addressId,
        addressName: payment.address.addressName,
        postalAddress: payment.address.postalAddress,
        cityVillage: payment.address.cityVillage,
        stateId: payment.address.stateId,
        state: payment.address.state?.state || '',
        countryId: payment.address.countryId,
        country: payment.address.country.country || '',
        countryCode: payment.billingAddress.country.countryCode || '',
        pinCode: payment.address.pinCode,
        addressTypeId: payment.address.addressTypeId,
        addressType: payment.address.addressType.addressType || '',
      } as IAddress;
    }
    if (!billingAddress) {
      throw new BadRequestException('Billing address not found for invoice generation');
    }
    // Convert payment to model to get calculated amounts
    const paymentModel = this.convertToModel(payment);
    // Prepare member info
    const memberInfo: IMemberInfo = {
      fullName: paymentModel.memberName,
      emailId: payment.member.emailId,
      contactNumber: payment.member.contactNumber,
    };
    // Map payment to InvoiceDocument using the universal invoice system
    const invoiceDoc = mapPaymentToInvoiceDocument(
      paymentModel,
      member.franchise,
      billingAddress,
      TransactionType.SERVICE, // Default to SERVICE for diet consultancy
      franchiseAddress,
      `Diet Consultancy - ${paymentModel.program} - ${paymentModel.programPlan}`,
      memberInfo,
    );
    const fileName = `invoice-${paymentModel.memberPaymentId}.pdf`;
    const relativePath = `${MediaForEnum.DOWNLOADS}/${memberId}/invoices`;
    const destinationFolderPath = `${this.rootFolderPath}/${relativePath}`;
    //CREATE DIRECTORY IF NOT EXISTS
    if (!fs.existsSync(destinationFolderPath)) {
      fs.mkdirSync(destinationFolderPath, { recursive: true });
    }
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    // Generate PDF using the new InvoicePdfService
    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoiceDoc);
    const base64Buffer = pdfBuffer.toString('base64');
    // Write PDF buffer to destination folder (write the binary buffer, not the base64 string)
    fs.writeFileSync(destinationPath, Uint8Array.from(pdfBuffer));
    return {
      filePath: relativePath,
      fileName: fileName,
      buffer: base64Buffer,
    } as IFileModel;
  }
}
