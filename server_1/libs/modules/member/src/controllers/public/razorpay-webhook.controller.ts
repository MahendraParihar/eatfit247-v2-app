import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Public, RequestedIp, AppConfigService } from "@server_1/core";
import { RazorpayService, InvoiceSequenceService } from "@server_1/platform";
import { PaymentGatewayCredentialService } from "@server_1/modules/payment";
import { FranchiseService } from "@server_1/modules/franchise";
import { MemberPlanService } from '../../services';
import { MemberProductService } from '../../services';
import { TxnMemberPayment, TxnMemberProduct } from "../../models";
import { PaymentStatusEnum, ConfigParam, BusinessTypeEnum } from '@eatfit247-shared-lib';
import * as crypto from "crypto";

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string | null;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, any>;
        fee: number | null;
        tax: number | null;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        acquirer_data: Record<string, any>;
        created_at: number;
      };
    };
    payment_link?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        description: string | null;
        customer: {
          name: string;
          email: string;
          contact: string;
        };
        status: string;
        notes: Record<string, any>;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: Record<string, any>;
        created_at: number;
      };
    };
  };
}

@Public()
@Controller("razorpay/webhook")
export class RazorpayWebhookController {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly memberPlanService: MemberPlanService,
    private readonly memberProductService: MemberProductService,
    private readonly appConfigService: AppConfigService,
    private readonly franchiseService: FranchiseService,
    private readonly invoiceSequenceService: InvoiceSequenceService,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Headers("x-razorpay-signature") signature: string,
    @RequestedIp() requestedIp: string
  ) {
    // Get raw body from request (set by middleware)
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException("Raw body not found");
    }
    if (!signature) {
      throw new UnauthorizedException("Razorpay signature header missing");
    }
    // Parse payload from raw body (since body stream is consumed by middleware)
    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      throw new UnauthorizedException("Invalid webhook payload format");
    }
    // Validate payload exists
    if (!payload) {
      throw new UnauthorizedException("Webhook payload is missing");
    }
    if (!payload.payload) {
      throw new UnauthorizedException("Webhook payload structure is invalid");
    }
    // Extract order ID from payload to find the payment gateway credentials
    let orderId: string | null = null;
    let paymentId: string | null = null;
    let franchisePaymentGatewayId: number | null = null;
    if (payload.payload?.payment?.entity) {
      orderId = payload.payload.payment.entity.order_id;
      paymentId = payload.payload.payment.entity.id;
    } else if (payload.payload?.order?.entity) {
      orderId = payload.payload.order.entity.id;
    } else if (payload.payload?.payment_link?.entity) {
      // For payment links, we need to extract from notes
      const notes = payload.payload.payment_link.entity.notes || {};
      orderId = notes["orderId"] || null;
    }
    if (!orderId) {
      throw new UnauthorizedException("Order ID not found in webhook payload");
    }
    // Find the order to get franchise payment gateway ID
    // Try to find in member payments (plans) first
    let orderType: "plan" | "product" | null = null;
    let order: any = null;
    try {
      order = await this.memberPlanService.findByGatewayOrderId(orderId);
      orderType = "plan";
    } catch (error) {
      // Not found in plans, try products
      try {
        order = await this.memberProductService.findByGatewayOrderId(orderId);
        orderType = "product";
      } catch (error) {
        throw new UnauthorizedException(
          `Order not found for gateway order ID: ${orderId}`
        );
      }
    }
    // Get payment gateway credentials using franchise payment gateway ID from notes or order
    // For Razorpay, we need to get credentials based on the gateway used
    // Since we don't have direct access to franchisePaymentGatewayId from order,
    // we'll need to get it from the payment gateway resolver or store it in notes
    const notes = payload.payload?.payment?.entity?.notes || payload.payload?.payment_link?.entity?.notes || {};
    const franchisePaymentGatewayIdFromNotes = notes["franchisePaymentGatewayId"]
      ? parseInt(notes["franchisePaymentGatewayId"], 10)
      : null;
    if (!franchisePaymentGatewayIdFromNotes) {
      throw new UnauthorizedException(
        "Franchise payment gateway ID not found in webhook payload"
      );
    }
    // Get webhook secret from credentials
    const credentialMode = this.appConfigService.getString(ConfigParam.PAYMENT_MODE);
    const credentials = await this.paymentGatewayCredentialService.getActiveCredentials(
      franchisePaymentGatewayIdFromNotes,
      credentialMode
    );
    if (!credentials) {
      throw new UnauthorizedException(
        "Payment gateway credentials not found"
      );
    }
    // Verify webhook signature
    const webhookSecret = credentials.webhookSecretEncrypted;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    if (expectedSignature !== signature) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    // Process webhook event
    const event = payload.event;
    console.log(`Processing Razorpay webhook event: ${event} for order: ${orderId}`);
    try {
      switch (event) {
        case "payment.captured":
          await this.handlePaymentCaptured(
            payload,
            orderType,
            order,
            paymentId,
            requestedIp
          );
          break;
        case "payment.failed":
          await this.handlePaymentFailed(
            payload,
            orderType,
            order,
            paymentId,
            requestedIp
          );
          break;
        case "payment_link.paid":
          await this.handlePaymentLinkPaid(
            payload,
            orderType,
            order,
            requestedIp
          );
          break;
        case "order.paid":
          await this.handleOrderPaid(
            payload,
            orderType,
            order,
            paymentId,
            requestedIp
          );
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
      return { status: "success" };
    } catch (error) {
      console.error(`Error processing webhook event ${event}:`, error);
      throw error;
    }
  }

  private async handlePaymentCaptured(
    payload: RazorpayWebhookPayload,
    orderType: "plan" | "product",
    order: any,
    paymentId: string | null,
    requestedIp: string
  ) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      throw new Error("Payment entity not found in payload");
    }
    if (orderType === "plan") {
      // Update member payment (plan)
      const paymentRecord = await this.memberPaymentRepository.findOne({
        where: { gatewayOrderId: payment.order_id }
      });
      if (paymentRecord) {
        paymentRecord.paymentStatusId = PaymentStatusEnum.PAID;
        paymentRecord.gatewayPaymentId = paymentId || payment.id;
        paymentRecord.transactionId = paymentId || payment.id;
        paymentRecord.paymentDate = new Date(payment.created_at * 1000);
        paymentRecord.paymentGatewayResponse = payment;
        paymentRecord.modifiedIp = requestedIp;
        await paymentRecord.save();
        // Generate invoice if not already generated
        if (!paymentRecord.invoiceId && paymentRecord.franchiseId) {
          const franchiseDetails = await this.franchiseService.fetchById(paymentRecord.franchiseId);
          const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
            paymentRecord.franchiseId,
            franchiseDetails.financialYear,
            franchiseDetails.franchiseCode,
            BusinessTypeEnum.SERVICE,
            null
          );
          paymentRecord.invoiceId = invoiceNumber;
          await paymentRecord.save();
        }
      }
    } else if (orderType === "product") {
      // Update member product order
      const productOrder = await this.memberProductRepository.findOne({
        where: { gatewayOrderId: payment.order_id }
      });
      if (productOrder) {
        productOrder.paymentStatusId = PaymentStatusEnum.PAID;
        productOrder.gatewayPaymentId = paymentId || payment.id;
        productOrder.transactionId = paymentId || payment.id;
        productOrder.paymentDate = new Date(payment.created_at * 1000);
        productOrder.paymentGatewayResponse = payment;
        productOrder.modifiedIp = requestedIp;
        await productOrder.save();
        // Generate invoice if not already generated
        if (!productOrder.invoiceId && productOrder.franchiseId) {
          const franchiseDetails = await this.franchiseService.fetchById(productOrder.franchiseId);
          const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
            productOrder.franchiseId,
            franchiseDetails.financialYear,
            franchiseDetails.franchiseCode,
            BusinessTypeEnum.PRODUCT,
            null
          );
          productOrder.invoiceId = invoiceNumber;
          await productOrder.save();
        }
      }
    }
  }

  private async handlePaymentFailed(
    payload: RazorpayWebhookPayload,
    orderType: "plan" | "product",
    order: any,
    paymentId: string | null,
    requestedIp: string
  ) {
    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      throw new Error("Payment entity not found in payload");
    }
    if (orderType === "plan") {
      const paymentRecord = await this.memberPaymentRepository.findOne({
        where: { gatewayOrderId: payment.order_id }
      });
      if (paymentRecord && paymentRecord.paymentStatusId === PaymentStatusEnum.PENDING) {
        paymentRecord.paymentStatusId = PaymentStatusEnum.FAILED;
        paymentRecord.gatewayPaymentId = paymentId || payment.id;
        paymentRecord.paymentGatewayResponse = payment;
        paymentRecord.modifiedIp = requestedIp;
        await paymentRecord.save();
      }
    } else if (orderType === "product") {
      const productOrder = await this.memberProductRepository.findOne({
        where: { gatewayOrderId: payment.order_id }
      });
      if (productOrder && productOrder.paymentStatusId === PaymentStatusEnum.PENDING) {
        productOrder.paymentStatusId = PaymentStatusEnum.FAILED;
        productOrder.gatewayPaymentId = paymentId || payment.id;
        productOrder.paymentGatewayResponse = payment;
        productOrder.modifiedIp = requestedIp;
        await productOrder.save();
      }
    }
  }

  private async handlePaymentLinkPaid(
    payload: RazorpayWebhookPayload,
    orderType: "plan" | "product",
    order: any,
    requestedIp: string
  ) {
    const paymentLink = payload.payload?.payment_link?.entity;
    if (!paymentLink) {
      throw new Error("Payment link entity not found in payload");
    }
    // For payment links, we need to find the order by the payment link ID
    const paymentLinkId = paymentLink.id;
    if (orderType === "plan") {
      const paymentRecord = await this.memberPaymentRepository.findOne({
        where: { paymentLink: paymentLinkId }
      });
      if (paymentRecord && paymentRecord.paymentStatusId === PaymentStatusEnum.PENDING) {
        paymentRecord.paymentStatusId = PaymentStatusEnum.PAID;
        paymentRecord.paymentDate = new Date(paymentLink.created_at * 1000);
        paymentRecord.paymentGatewayResponse = paymentLink;
        paymentRecord.modifiedIp = requestedIp;
        await paymentRecord.save();
        // Generate invoice if not already generated
        if (!paymentRecord.invoiceId && paymentRecord.franchiseId) {
          const franchiseDetails = await this.franchiseService.fetchById(paymentRecord.franchiseId);
          const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
            paymentRecord.franchiseId,
            franchiseDetails.financialYear,
            franchiseDetails.franchiseCode,
            BusinessTypeEnum.SERVICE,
            null
          );
          paymentRecord.invoiceId = invoiceNumber;
          await paymentRecord.save();
        }
      }
    } else if (orderType === "product") {
      const productOrder = await this.memberProductRepository.findOne({
        where: { paymentLink: paymentLinkId }
      });
      if (productOrder && productOrder.paymentStatusId === PaymentStatusEnum.PENDING) {
        productOrder.paymentStatusId = PaymentStatusEnum.PAID;
        productOrder.paymentDate = new Date(paymentLink.created_at * 1000);
        productOrder.paymentGatewayResponse = paymentLink;
        productOrder.modifiedIp = requestedIp;
        await productOrder.save();
        // Generate invoice if not already generated
        if (!productOrder.invoiceId && productOrder.franchiseId) {
          const franchiseDetails = await this.franchiseService.fetchById(productOrder.franchiseId);
          const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
            productOrder.franchiseId,
            franchiseDetails.financialYear,
            franchiseDetails.franchiseCode,
            BusinessTypeEnum.PRODUCT,
            null
          );
          productOrder.invoiceId = invoiceNumber;
          await productOrder.save();
        }
      }
    }
  }

  private async handleOrderPaid(
    payload: RazorpayWebhookPayload,
    orderType: "plan" | "product",
    order: any,
    paymentId: string | null,
    requestedIp: string
  ) {
    const orderEntity = payload.payload?.order?.entity;
    if (!orderEntity) {
      throw new Error("Order entity not found in payload");
    }
    // Similar to payment.captured, update the order status
    await this.handlePaymentCaptured(
      payload,
      orderType,
      order,
      paymentId,
      requestedIp
    );
  }
}

