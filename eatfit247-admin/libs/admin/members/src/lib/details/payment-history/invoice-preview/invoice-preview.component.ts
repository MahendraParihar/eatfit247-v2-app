import { Component, Inject, Input, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IMemberPayment, TaxMode } from '@eatfit247-shared-lib';
import { IAddress } from '@eatfit247-shared-lib';

export interface InvoicePreviewDialogData {
  payment: IMemberPayment;
}

@Component({
  selector: 'lib-invoice-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.scss',
})
export class InvoicePreviewComponent {
  @Input() payment?: IMemberPayment;

  constructor(
    @Optional() public dialogRef?: MatDialogRef<InvoicePreviewComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: InvoicePreviewDialogData,
  ) {
    // If used in dialog, get payment from dialog data
    if (this.data?.payment && !this.payment) {
      this.payment = this.data.payment;
    }
  }

  get paymentData(): IMemberPayment {
    if (!this.payment) {
      throw new Error('Payment data is required. Provide via @Input() or dialog data.');
    }
    return this.payment;
  }

  displayedColumns: string[] = ['description', 'quantity', 'rate', 'amount'];

  get invoiceData() {
    return {
      invoiceNumber: this.paymentData.invoiceId || 'N/A',
      invoiceDate: this.paymentData.paymentDate,
      currency: this.paymentData.paymentObj?.currency || 'INR',
    };
  }

  get serviceDetails() {
    return {
      description: 'Diet Consultancy',
      quantity: 1,
      rate: this.paymentData.paymentObj?.pricing?.orderAmount || 0,
      amount: this.paymentData.paymentObj?.pricing?.orderAmount || 0,
    };
  }

  get pricing() {
    return this.paymentData.paymentObj?.pricing || {
      orderAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    };
  }

  get tax() {
    return this.paymentData.paymentObj?.tax || {
      taxType: undefined,
      taxMode: undefined,
      taxPercentage: 0,
      taxAmount: 0,
      isTaxIncludedInPrice: false,
      isLutApplied: false,
      taxObj: {},
    };
  }

  get jurisdiction() {
    return this.paymentData.paymentObj?.jurisdiction || {
      entityCountry: '',
      customerCountry: '',
      placeOfSupply: '',
    };
  }

  get invoiceNote() {
    return this.paymentData.paymentObj?.invoice?.note || '';
  }

  get isExportOfService(): boolean {
    return this.tax.taxMode === TaxMode.EXPORT_OF_SERVICE;
  }

  get isDomesticGst(): boolean {
    return this.tax.taxMode === TaxMode.DOMESTIC;
  }

  get isRcm(): boolean {
    // RCM might be indicated by a specific taxMode or flag
    // For now, checking if taxMode contains 'RCM' or if there's a specific indicator
    return (
      this.tax.taxMode?.toUpperCase().includes('RCM') ||
      this.tax.taxMode === 'RCM'
    );
  }

  get taxBreakdown(): Array<{ name: string; percentage: number; amount: number }> {
    if (!this.tax.taxObj || Object.keys(this.tax.taxObj).length === 0) {
      return [];
    }

    return Object.entries(this.tax.taxObj).map(([name, value]) => ({
      name,
      percentage: value.taxPercentage || 0,
      amount: value.amount || 0,
    }));
  }

  get customerAddress() {
    return this.paymentData.billingAddress || this.paymentData.address;
  }

  formatCurrency(amount: number | undefined | null): string {
    const currency = this.invoiceData.currency;
    if (amount === null || amount === undefined) {
      return `${currency} 0.00`;
    }
    return `${currency} ${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatDate(date: Date | string | undefined | null): string {
    if (!date) {
      return 'N/A';
    }
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatAddress(address: IAddress | undefined | null): string {
    if (!address) {
      return 'N/A';
    }
    const parts: string[] = [];
    if (address.addressName) parts.push(address.addressName);
    if (address.postalAddress) parts.push(address.postalAddress);
    if (address.cityVillage) parts.push(address.cityVillage);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (address.pinCode) parts.push(address.pinCode);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }

  downloadPdf(): void {
    // Wireframe only - no backend call
    console.log('Download PDF clicked for invoice:', this.paymentData.invoiceId);
    // TODO: Implement PDF download when backend endpoint is available
  }

  close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}

