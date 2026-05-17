import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutService } from '../../core/services';
import { IAddress } from '@eatfit247-shared-library/core';
import { BreadcrumbsComponent, LoaderComponent } from '@shared-ui';

interface OrderDetails {
  memberOrderId: number;
  memberId?: number;
  invoiceId?: string;
  orderAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  paymentDate: Date;
  paymentStatus?: string;
  member?: {
    firstName: string;
    lastName: string;
    emailId: string;
    contactNumber: string;
  };
  orderItems?: Array<{
    productName: string;
    quantity: number;
    quantityLabel: string;
    unitPrice: number;
    totalAmount: number;
    taxAmount: number;
  }>;
  address?: IAddress;
}

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    BreadcrumbsComponent
  ],
  templateUrl: './checkout-success.component.html',
  styleUrl: './checkout-success.component.scss'
})
export class CheckoutSuccessComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkoutService = inject(CheckoutService);
  private readonly platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();
  loading = signal(true);
  error = signal(null);
  orderDetails: OrderDetails | null = null;
  downloadingInvoice = false;
  isPlanOrder = false;
  readonly contactInfo = {
    phone: '+91-859-185-4209',
    email: 'eatfit24by7@gmail.com'
  };

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      const orderId = params['orderId'];
      const planId = params['planId'];
      if (!orderId) {
        this.error.set('Order ID is missing. Please contact support.');
        this.loading.set(false);
        return;
      }
      try {
        // Determine if it's a plan order or product order
        this.isPlanOrder = !!planId;
        await this.loadOrderDetails(orderId, this.isPlanOrder);
      } catch (error: unknown) {
        this.error.set(
          error instanceof Error ? error.message :
          'Failed to load order details. Please contact support.',
        );
      } finally {
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load order details by gateway order ID
   * Uses different endpoints based on an order type:
   * - Plan orders: public/checkout/order/plan/:gatewayOrderId
   * - Product orders: public/checkout/order/:gatewayOrderId
   */
  async loadOrderDetails(
    gatewayOrderId: string,
    isPlanOrder: boolean = false
  ): Promise<void> {
    let data;
    if (isPlanOrder) {
      data = await this.checkoutService.getPlanOrderDetails(gatewayOrderId);
      this.orderDetails = {
        ...data,
        memberOrderId: data.memberPaymentId,
        currencyCode: data.currency
      };
    } else {
      data = await this.checkoutService.getProductOrderDetails(gatewayOrderId);
      this.orderDetails = {
        ...data,
        orderAmount: data.subTotalAmount,
        memberOrderId: data.memberProductId,
        currencyCode: data.currency
      };
    }
  }

  /**
   * Navigate to home page
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Check if the invoice can be downloaded
   * Returns true if all required data is available
   */
  get canDownloadInvoice(): boolean {
    return !!this.orderDetails?.memberOrderId;
  }

  /**
   * Download invoice for the order
   * Handles both plan orders and product orders
   */
  async downloadInvoice(): Promise<void> {
    if (!this.orderDetails || !this.orderDetails.memberId) {
      this.error.set('Unable to download invoice. Missing order information.');
      return;
    }
    // For product orders, we need memberProductId
    const orderId = this.orderDetails.memberOrderId;
    if (!orderId) {
      this.error.set('Unable to download invoice. Missing order ID.');
      return;
    }
    try {
      this.downloadingInvoice = true;
      const result = this.isPlanOrder
        ? await this.checkoutService.downloadPlanInvoice(
          this.orderDetails.memberId,
          orderId
        )
        : await this.checkoutService.downloadInvoice(
          this.orderDetails.memberId,
          orderId
        );
      if (result && result.buffer && result.fileName) {
        if (!isPlatformBrowser(this.platformId)) {
          throw new Error('Download is only available in browser');
        }
        // Convert base64 buffer to blob and download
        const byteCharacters = atob(result.buffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        // Create a download link
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = result.fileName;
        link.click();
        // Clean up
        window.URL.revokeObjectURL(link.href);
      } else {
        throw new Error('Invalid invoice data received');
      }
    } catch (error: unknown) {
      console.error('Error downloading invoice:', error);
      this.error.set(
        error instanceof Error ? error.message :
        'Failed to download invoice. Please try again or contact support.',
      );
    } finally {
      this.downloadingInvoice = false;
    }
  }
}
