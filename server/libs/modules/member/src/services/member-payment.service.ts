import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMember, TxnMemberPayment } from '../models';
import {
  IMemberPaymentMasterData,
  IMemberPayment,
  IManageMemberPayment,
  ITableList,
  IDropdownItem,
  PaymentSourceEnum,
  TableEnum,
  ConfigParam,
  IAddress,
} from '@eatfit247-shared-lib';
import {
  EmailNotificationService,
  PaymentModeService,
  PaymentStatusService,
  AddressService,
  AppConfigService,
  CommonFunctionsUtil,
  CountryService,
  StateService,
} from '@server/common';
import { MstFranchise } from '@server/common';
import { ProgramService, ProgramPlanService } from '@server/modules/program-plan';
import { TaxEngineService, TaxInput } from '@server/modules/tax-engine';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MemberPaymentService {
  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    private sequelize: Sequelize,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly appConfigService: AppConfigService,
    private readonly paymentModeService: PaymentModeService,
    private readonly paymentStatusService: PaymentStatusService,
    private readonly programService: ProgramService,
    private readonly programPlanService: ProgramPlanService,
    private readonly addressService: AddressService,
    private readonly taxEngineService: TaxEngineService,
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
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
    // Generate invoice ID if not provided
    const invoiceId = this.generateInvoiceId();
    // Check if invoice ID already exists
    const existingInvoice = await this.memberPaymentRepository.findOne({
      where: { invoiceId },
    });
    if (existingInvoice) {
      throw new BadRequestException('Invoice ID already exists');
    }
    const t = await this.sequelize.transaction();
    try {
      // Handle address if provided
      let addressId = obj.addressId;
      if (obj.address && !addressId) {
        await this.addressService.createOrUpdate(
          {
            ...obj.address,
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: memberId,
          },
          requestedIp,
          adminId,
        );
        // Get the created address
        const createdAddress = await this.addressService.findByTableIdAndPk(
          TableEnum.TXN_MEMBER,
          memberId,
        );
        addressId = createdAddress?.addressId;
      }
      // Handle billing address if provided
      let billingAddressId = obj.billingAddressId;
      let billingAddress: IAddress | null = null;
      if (obj.billingAddressId && !billingAddressId) {
        await this.addressService.createOrUpdate(
          {
            ...obj.billingAddress,
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: memberId,
          },
          requestedIp,
          adminId,
        );
        // Get the created billing address
        const createdBillingAddress = await this.addressService.findByTableIdAndPk(
          TableEnum.TXN_MEMBER,
          memberId,
        );
        billingAddressId = createdBillingAddress?.addressId;
        billingAddress = createdBillingAddress;
      } else if (billingAddressId) {
        billingAddress = await this.addressService.findByTableIdAndPk(
          TableEnum.TXN_MEMBER,
          memberId,
        );
      }
      if (!billingAddress.country) {
        throw new BadRequestException('Billing address country missing');
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
        {},
        obj.isTaxApplicable,
        billingAddress,
        franchiseAddress,
      );
      // Create a payment record
      const payment = await this.memberPaymentRepository.create(
        {
          memberId,
          paymentModeId: obj.paymentModeId,
          programPlanId: obj.programPlanId,
          programId: obj.programId,
          addressId: addressId,
          billingAddressId: billingAddressId,
          transactionId: obj.transactionId || null,
          paymentDate: obj.paymentDate,
          invoiceId: invoiceId || null,
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
        },
        { transaction: t },
      );
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
    const t = await this.sequelize.transaction();
    try {
      // Handle address updates if provided
      let addressId = obj.addressId !== undefined ? obj.addressId : payment.addressId;
      if (obj.address) {
        await this.addressService.createOrUpdate(
          {
            ...obj.address,
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: memberId,
          },
          requestedIp,
          adminId,
        );
        const updatedAddress = await this.addressService.findByTableIdAndPk(
          TableEnum.TXN_MEMBER,
          memberId,
        );
        addressId = updatedAddress?.addressId || addressId;
      }
      // Handle billing address updates if provided
      let billingAddressId =
        obj.billingAddressId !== undefined ? obj.billingAddressId : payment.billingAddressId;
      let billingAddress: IAddress | null = null;
      if (obj.billingAddress) {
        await this.addressService.createOrUpdate(
          {
            ...obj.billingAddress,
            tableId: TableEnum.TXN_MEMBER,
            pkOfTable: memberId,
          },
          requestedIp,
          adminId,
        );
        const updatedBillingAddress = await this.addressService.findByTableIdAndPk(
          TableEnum.TXN_MEMBER,
          memberId,
        );
        billingAddressId = updatedBillingAddress?.addressId || billingAddressId;
        billingAddress = updatedBillingAddress;
      } else if (billingAddressId) {
        // Get an existing billing address
        billingAddress = await this.addressService.findByTableIdAndPk(
          TableEnum.TXN_MEMBER,
          memberId,
        );
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
      await payment.update(
        {
          paymentModeId:
            obj.paymentModeId !== undefined ? obj.paymentModeId : payment.paymentModeId,
          programPlanId:
            obj.programPlanId !== undefined ? obj.programPlanId : payment.programPlanId,
          programId: obj.programId !== undefined ? obj.programId : payment.programId,
          addressId: addressId || null,
          billingAddressId: billingAddressId || null,
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
        },
        { transaction: t },
      );
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
      deletable: true, // TODO: Add logic to determine if payment can be deleted
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
    const taxObject = userSection?.taxObj || systemSection?.taxObj || paymentObj?.taxObj || undefined;
    // If using old structure, calculate tax
    if (!userSection && !systemSection && isTaxApplicable && !taxObject) {
      const subtotal = orderAmount - discountAmount;
      const taxPercentage = paymentObj?.taxPercentage || this.appConfigService.getNumber(ConfigParam.TAX_PERCENTAGE, true, 0);
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
   * Generate a unique invoice ID
   */
  private generateInvoiceId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Calculate payment object using tax engine based on billing address and franchise address
   */
  private async calculatePaymentObject(
    paymentObjInput: any,
    isTaxApplicable: boolean,
    billingAddress: IAddress | null,
    franchiseAddress: IAddress | null,
  ): Promise<any> {
    const orderAmount = paymentObjInput?.orderAmount || paymentObjInput?.orderAmount || 0;
    const discountAmount = paymentObjInput?.discountAmount || 0;
    const currencyCode = paymentObjInput?.currencyCode || 'INR';
    const noOfCycle = paymentObjInput?.noOfCycle || 0;
    const noOfDaysInCycle = paymentObjInput?.noOfDaysInCycle || 0;
    const isPlanFeesIncludedTax = paymentObjInput?.isPlanFeesIncludedTax || false;
    // Get country and state codes from addresses
    let supplierCountryCode = 'IN'; // Default to India
    let supplierStateCode: string | null = null;
    let customerCountryCode = 'IN'; // Default to India
    let customerStateCode: string | null = null;
    if (franchiseAddress) {
      // Get franchise country code
      if (franchiseAddress.countryId) {
        const franchiseCountry = await this.countryService.fetchById(franchiseAddress.countryId);
        supplierCountryCode = franchiseCountry.countryCode || 'IN';
      }
      // Get franchise state code
      if (franchiseAddress.stateId) {
        const franchiseState = await this.stateService.fetchById(franchiseAddress.stateId);
        supplierStateCode = franchiseState.code || null;
      }
    }
    if (billingAddress) {
      // Get customer country code
      if (billingAddress.countryId) {
        const customerCountry = await this.countryService.fetchById(billingAddress.countryId);
        customerCountryCode = customerCountry.countryCode || 'IN';
      }
      // Get customer state code
      if (billingAddress.stateId) {
        const customerState = await this.stateService.fetchById(billingAddress.stateId);
        customerStateCode = customerState.code || null;
      }
    }
    // Calculate base amounts
    let systemOrderAmount = orderAmount;
    let systemDiscountAmount = discountAmount;
    let systemSubtotal = systemOrderAmount - systemDiscountAmount;
    let baseAmountForTax = systemSubtotal;
    // Handle isPlanFeesIncludedTax - extract base amount if tax is included
    if (isTaxApplicable && isPlanFeesIncludedTax) {
      // We need to know the tax percentage first to extract base amount
      // For now, use tax engine to get tax percentage, then recalculate
      const tempTaxInput: TaxInput = {
        baseAmount: systemOrderAmount,
        discountAmount: 0,
        isTaxApplicable: true,
        supplierCountryCode,
        supplierStateCode,
        customerCountryCode,
        customerStateCode,
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
    // Calculate user amounts (same as system for now, can be converted later)
    const userOrderAmount = systemOrderAmount;
    const userDiscountAmount = systemDiscountAmount;
    const userTaxAmount = systemTaxAmount;
    const userTotalAmount = systemTotalAmount;
    return {
      user: {
        orderAmount: userOrderAmount,
        discountAmount: userDiscountAmount,
        taxAmount: userTaxAmount,
        totalAmount: userTotalAmount,
        currency: currencyCode,
        taxObj: taxResult.taxObj,
      },
      system: {
        orderAmount: systemOrderAmount,
        discountAmount: systemDiscountAmount,
        taxAmount: systemTaxAmount,
        totalAmount: systemTotalAmount,
        currency: currencyCode,
        taxObj: taxResult.taxObj,
      },
      taxPercentage: taxResult.taxPercentage,
      noOfCycle: noOfCycle,
      noOfDaysInCycle: noOfDaysInCycle,
      isPlanFeesIncludedTax: isPlanFeesIncludedTax,
    };
  }
}
