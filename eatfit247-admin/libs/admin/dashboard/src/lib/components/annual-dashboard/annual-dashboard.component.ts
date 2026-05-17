import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PermissionService } from '@core';
import {
  IAnnualFranchiseContext,
  IAnnualOverview,
  IAnnualTaxBreakdown,
  IAnnualTaxRow,
  IAnnualTopPlans,
  TopPlansMode,
} from '@eatfit247-shared-lib';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
import { DashboardApiService, IAnnualFranchiseSummary } from '../../api.service';

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

const SUPER_ADMIN_ROLE = 'super_admin';

@Component({
  selector: 'lib-annual-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxEchartsDirective,
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './annual-dashboard.component.html',
  styleUrl: './annual-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnualDashboardComponent implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly permissions = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  showFranchiseFilter = false;
  franchises: IAnnualFranchiseSummary[] = [];
  selectedFranchiseId: number | null = null;

  context?: IAnnualFranchiseContext;
  selectedFyStartYear: number | null = null;

  overview?: IAnnualOverview;
  tax?: IAnnualTaxBreakdown;
  topPlans?: IAnnualTopPlans;
  topPlansMode: TopPlansMode = 'count';

  contextLoading = false;
  dataLoading = false;

  lineChartOptions: EChartsCoreOption = {};
  pieChartOptions: EChartsCoreOption = {};

  readonly taxColumns = ['monthLabel', 'taxableAmount', 'taxAmount', 'totalAmount'];

  async ngOnInit(): Promise<void> {
    const roleCodes = this.permissions.getRoleCodes();
    this.showFranchiseFilter = roleCodes.includes(SUPER_ADMIN_ROLE);

    this.contextLoading = true;
    this.cdr.markForCheck();
    try {
      if (this.showFranchiseFilter) {
        this.franchises = await this.api.getAnnualFranchises();
      }
      await this.loadContextAndData();
    } finally {
      this.contextLoading = false;
      this.cdr.markForCheck();
    }
  }

  async onFranchiseChange(): Promise<void> {
    this.contextLoading = true;
    this.cdr.markForCheck();
    try {
      await this.loadContextAndData();
    } finally {
      this.contextLoading = false;
      this.cdr.markForCheck();
    }
  }

  async onFyChange(): Promise<void> {
    if (this.selectedFyStartYear === null) return;
    await this.loadData();
  }

  async onTopPlansModeChange(mode: TopPlansMode): Promise<void> {
    this.topPlansMode = mode;
    if (this.selectedFyStartYear === null) return;
    try {
      this.topPlans = await this.api.getAnnualTopPlans(
        this.selectedFyStartYear,
        this.topPlansMode,
        this.selectedFranchiseId ?? undefined,
      );
      this.pieChartOptions = this.buildPieOptions(this.topPlans);
    } catch {
      // handled by interceptor
    } finally {
      this.cdr.markForCheck();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value || 0);
  }

  private async loadContextAndData(): Promise<void> {
    this.context = await this.api.getAnnualContext(this.selectedFranchiseId ?? undefined);
    const years = this.context.availableYears;
    this.selectedFyStartYear = years.length > 0 ? years[0].fyStartYear : new Date().getFullYear();
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    if (this.selectedFyStartYear === null) return;
    this.dataLoading = true;
    this.cdr.markForCheck();
    try {
      const franchiseId = this.selectedFranchiseId ?? undefined;
      const [overview, tax, topPlans] = await Promise.all([
        this.api.getAnnualOverview(this.selectedFyStartYear, franchiseId),
        this.api.getAnnualTax(this.selectedFyStartYear, franchiseId),
        this.api.getAnnualTopPlans(this.selectedFyStartYear, this.topPlansMode, franchiseId),
      ]);
      this.overview = overview;
      this.tax = tax;
      this.topPlans = topPlans;

      this.lineChartOptions = this.buildLineOptions(overview);
      this.pieChartOptions = this.buildPieOptions(topPlans);
    } catch {
      // handled by interceptor
    } finally {
      this.dataLoading = false;
      this.cdr.markForCheck();
    }
  }

  get taxRows(): IAnnualTaxRow[] {
    return this.tax?.rows ?? [];
  }

  private buildLineOptions(overview: IAnnualOverview): EChartsCoreOption {
    const months = overview.months.map((m) => m.monthLabel);
    const customers = overview.months.map((m) => m.customerCount);
    const plans = overview.months.map((m) => m.planSoldCount);
    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['Customers Registered', 'Plans Sold'],
        bottom: 0,
      },
      grid: {
        left: 40,
        right: 24,
        top: 24,
        bottom: 48,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          name: 'Customers Registered',
          type: 'line',
          smooth: true,
          data: customers,
          symbol: 'circle',
          symbolSize: 8,
        },
        {
          name: 'Plans Sold',
          type: 'line',
          smooth: true,
          data: plans,
          symbol: 'circle',
          symbolSize: 8,
        },
      ],
    };
  }

  private buildPieOptions(top: IAnnualTopPlans): EChartsCoreOption {
    const data = top.slices.map((s) => ({ name: s.planName, value: s.value }));
    const isRevenue = top.mode === 'revenue';
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: { name: string; value: number; percent: number }) => {
          const valueText = isRevenue
            ? this.formatCurrency(params.value)
            : `${params.value}`;
          return `${params.name}<br/>${valueText} (${params.percent}%)`;
        },
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'middle',
      },
      series: [
        {
          name: isRevenue ? 'Revenue' : 'Subscriptions',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          labelLine: { show: false },
          data,
        },
      ],
    };
  }
}
