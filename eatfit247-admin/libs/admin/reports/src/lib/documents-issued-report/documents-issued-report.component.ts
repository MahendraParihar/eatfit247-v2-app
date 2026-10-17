import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FinancialYearUtil,
  IDocumentsIssuedReport,
  IDocumentsIssuedRow,
  IDropdownItem,
  IFinancialYearOption,
} from '@eatfit247-shared-lib';
import { PaymentReportApiService } from '../payment-report/api.service';
import { DocumentsIssuedApiService, IDocumentsIssuedQuery } from './api.service';

type PeriodType = 'month' | 'quarter';

interface IPeriodOption {
  value: number;
  label: string;
  from: string;
  to: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * GSTR-1 Table 13 "Documents issued" (compliant invoice numbering, decision 13): one row per number
 * series for a franchise and a filing period (a month, or a quarter for QRMP filers), with a gap check
 * and a CSV that Accounts copies into the portal.
 */
@Component({
  selector: 'lib-documents-issued-report',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './documents-issued-report.html',
  styleUrl: './documents-issued-report.scss',
})
export class DocumentsIssuedReportComponent implements OnInit {
  readonly columns = ['natureOfDocument', 'fromNumber', 'toNumber', 'totalIssued', 'cancelled', 'netIssued', 'gap'];

  franchiseOptions: IDropdownItem[] = [];
  yearOptions: IFinancialYearOption[] = [];
  periodOptions: IPeriodOption[] = [];
  franchiseId: number | null = null;
  fyStartMonth = 4;
  fyStartYear: number | null = null;
  periodType: PeriodType = 'month';
  periodValue: number | null = null;

  report: IDocumentsIssuedReport | null = null;
  loading = false;
  downloading = false;

  private readonly contextApi = inject(PaymentReportApiService);
  private readonly api = inject(DocumentsIssuedApiService);

  async ngOnInit(): Promise<void> {
    await this.loadContext(undefined);
  }

  get rows(): IDocumentsIssuedRow[] {
    return this.report?.rows || [];
  }

  async onFranchiseChange(): Promise<void> {
    await this.loadContext(this.franchiseId ?? undefined);
  }

  async onYearChange(): Promise<void> {
    this.buildPeriodOptions(false);
    await this.load();
  }

  async onPeriodTypeChange(): Promise<void> {
    this.buildPeriodOptions(true);
    await this.load();
  }

  async onPeriodChange(): Promise<void> {
    await this.load();
  }

  async downloadCsv(): Promise<void> {
    const query = this.query();
    if (!query) {
      return;
    }
    this.downloading = true;
    try {
      const blob = await this.api.downloadCsv(query);
      const code = this.report?.franchiseCode || 'franchise';
      this.saveBlob(blob, `documents-issued_${code}_${query.from.replace(/-/g, '')}_to_${query.to.replace(/-/g, '')}.csv`);
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.downloading = false;
    }
  }

  gapTooltip(row: IDocumentsIssuedRow): string {
    return `Missing: ${row.missingNumbers.join(', ')}${row.missingTruncated ? ' and more' : ''}`;
  }

  private async loadContext(franchiseId: number | undefined): Promise<void> {
    try {
      const context = await this.contextApi.getContext(franchiseId);
      this.franchiseOptions = context.franchises;
      this.franchiseId = context.franchiseId;
      this.fyStartMonth = context.fyStartMonth;
      this.yearOptions = context.availableYears;
      const current = FinancialYearUtil.fyStartYearFor(this.fyStartMonth);
      this.fyStartYear = this.yearOptions.some((year) => year.fyStartYear === current)
        ? current
        : (this.yearOptions[0]?.fyStartYear ?? current);
      this.buildPeriodOptions(true);
      await this.load();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  /** Months or quarters of the selected FY; by default the last complete month / the current quarter. */
  private buildPeriodOptions(resetSelection: boolean): void {
    if (this.fyStartYear === null) {
      this.periodOptions = [];
      return;
    }
    const fyStartYear = this.fyStartYear;
    if (this.periodType === 'quarter') {
      this.periodOptions = FinancialYearUtil.buildQuarters(fyStartYear, this.fyStartMonth).map((quarter) => ({
        value: quarter.quarter,
        label: `${quarter.label} ${FinancialYearUtil.label(fyStartYear, this.fyStartMonth)}`,
        from: quarter.startDate,
        to: quarter.endDate,
      }));
    } else {
      this.periodOptions = Array.from({ length: 12 }, (_, index) => {
        const start = new Date(fyStartYear, this.fyStartMonth - 1 + index, 1);
        const end = new Date(fyStartYear, this.fyStartMonth + index, 0);
        return {
          value: index,
          label: `${MONTH_LABELS[start.getMonth()]} ${start.getFullYear()}`,
          from: FinancialYearUtil.toDateOnly(start),
          to: FinancialYearUtil.toDateOnly(end),
        };
      });
    }
    if (resetSelection || !this.periodOptions.some((option) => option.value === this.periodValue)) {
      this.periodValue = this.defaultPeriod();
    }
  }

  private defaultPeriod(): number {
    const today = FinancialYearUtil.toDateOnly(new Date());
    const index = this.periodOptions.findIndex((option) => option.from <= today && today <= option.to);
    if (index === -1) {
      return this.periodOptions[this.periodOptions.length - 1]?.value ?? 0;
    }
    // GSTR-1 is filed for the month just ended; a quarter is shown as it runs
    if (this.periodType === 'month' && index > 0) {
      return this.periodOptions[index - 1].value;
    }
    return this.periodOptions[index].value;
  }

  private query(): IDocumentsIssuedQuery | null {
    const period = this.periodOptions.find((option) => option.value === this.periodValue);
    if (!this.franchiseId || !period) {
      return null;
    }
    return { franchiseId: this.franchiseId, from: period.from, to: period.to };
  }

  private async load(): Promise<void> {
    const query = this.query();
    if (!query) {
      this.report = null;
      return;
    }
    this.loading = true;
    try {
      this.report = await this.api.getReport(query);
    } catch {
      this.report = null;
    } finally {
      this.loading = false;
    }
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
