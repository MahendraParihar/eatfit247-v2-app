import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutService } from '../../services/checkout.service';
import { HttpService } from '../../services/http.service';

interface OrderDetails {
  memberProductId: number;
  memberId?: number;
  orderId?: string;
  paymentId?: string;
  orderAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  paymentDate: string;
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
  }>;
  address?: {
    postalAddress: string;
    cityVillage: string;
    pinCode: string;
  };
}

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './checkout-success.component.html',
  styleUrl: './checkout-success.component.scss'
})
export class CheckoutSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly httpService = inject(HttpService);
  private readonly checkoutService = inject(CheckoutService);
  
  orderDetails: OrderDetails | null = null;
  loading = true;
  error: string | null = null;
  downloadingInvoice = false;
  
  readonly contactInfo = {
    phone: '+91-859-185-4209',
    email: 'eatfit24by7@gmail.com'
  };

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const orderId = params['orderId'];
      const paymentId = params['paymentId'];
      
      if (!orderId) {
        this.error = 'Order ID is missing. Please contact support.';
        this.loading = false;
        return;
      }

      try {
        await this.loadOrderDetails(orderId);
      } catch (error: any) {
        console.error('Error loading order details:', error);
        this.error = error.message || 'Failed to load order details. Please contact support.';
      } finally {
        this.loading = false;
      }
    });
  }

  /**
   * Load order details by gateway order ID
   */
  async loadOrderDetails(gatewayOrderId: string): Promise<void> {
    try {
      const data = await this.httpService.get<OrderDetails>(
        `public/checkout/order/${gatewayOrderId}`
      );
      this.orderDetails = data;
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      throw error;
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
   * Download invoice for the order
   */
  async downloadInvoice(): Promise<void> {
    if (!this.orderDetails || !this.orderDetails.memberId || !this.orderDetails.memberProductId) {
      this.error = 'Unable to download invoice. Missing order information.';
      return;
    }

    try {
      this.downloadingInvoice = true;
      const result = await this.checkoutService.downloadInvoice(
        this.orderDetails.memberId,
        this.orderDetails.memberProductId
      );

      if (result && result.buffer && result.fileName) {
        // Convert base64 buffer to blob and download
        const byteCharacters = atob(result.buffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Create download link
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = result.fileName;
        link.click();

        // Clean up
        window.URL.revokeObjectURL(link.href);
      } else {
        throw new Error('Invalid invoice data received');
      }
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      this.error = error.message || 'Failed to download invoice. Please try again or contact support.';
    } finally {
      this.downloadingInvoice = false;
    }
  }
}

