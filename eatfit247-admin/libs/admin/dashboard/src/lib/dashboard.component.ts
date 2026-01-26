import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { RevenueChartComponent } from './components/revenue-chart/revenue-chart.component';
import { MemberGrowthChartComponent } from './components/member-growth-chart/member-growth-chart.component';
import {
  ProgramPerformanceChartComponent
} from './components/program-performance-chart/program-performance-chart.component';
import { OperationsSummaryComponent } from './components/operations-summary/operations-summary.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import {
  IDashboardKpis,
  IEngagementData,
  IMemberGrowthData,
  IOperationsSnapshot,
  IProgramPerformanceData,
  IRevenueData
} from '@eatfit247-shared-lib';
import { DashboardApiService } from './api.service';

@Component({
  selector: 'lib-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    KpiCardComponent,
    RevenueChartComponent,
    MemberGrowthChartComponent,
    ProgramPerformanceChartComponent,
    OperationsSummaryComponent,
    QuickActionsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  kpis?: IDashboardKpis;
  revenueData?: IRevenueData;
  memberGrowthData?: IMemberGrowthData;
  programPerformanceData?: IProgramPerformanceData[];
  operationsSnapshot?: IOperationsSnapshot;
  engagementData?: IEngagementData;

  loading = {
    kpis: false,
    revenue: false,
    members: false,
    programs: false,
    operations: false,
    engagement: false,
  };

  memberPeriod: 'weekly' | 'monthly' = 'monthly';

  constructor(
    private apiService: DashboardApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }

  @HostListener('window:resize', ['$event'])
  onResize = (): void => {
    // Charts will handle their own resize
  };

  async loadAllData(): Promise<void> {
    await Promise.all([
      this.loadKpis(),
      this.loadRevenueData(),
      this.loadMemberGrowthData(),
      this.loadProgramPerformanceData(),
      this.loadOperationsSnapshot(),
      this.loadEngagementData(),
    ]);
  }

  async loadKpis(): Promise<void> {
    this.loading.kpis = true;
    this.cdr.markForCheck();
    try {
      this.kpis = await this.apiService.getKpis();
    } catch (error: any) {
      console.error('Failed to load KPIs:', error);
    } finally {
      this.loading.kpis = false;
      this.cdr.markForCheck();
    }
  }

  async loadRevenueData(): Promise<void> {
    this.loading.revenue = true;
    this.cdr.markForCheck();
    try {
      this.revenueData = await this.apiService.getRevenueData();
    } catch (error: any) {
      console.error('Failed to load revenue data:', error);
    } finally {
      this.loading.revenue = false;
      this.cdr.markForCheck();
    }
  }

  async loadMemberGrowthData(): Promise<void> {
    this.loading.members = true;
    this.cdr.markForCheck();
    try {
      this.memberGrowthData = await this.apiService.getMemberGrowthData(this.memberPeriod);
    } catch (error: any) {
      console.error('Failed to load member growth data:', error);
    } finally {
      this.loading.members = false;
      this.cdr.markForCheck();
    }
  }

  async loadProgramPerformanceData(): Promise<void> {
    this.loading.programs = true;
    this.cdr.markForCheck();
    try {
      this.programPerformanceData = await this.apiService.getProgramPerformanceData();
    } catch (error: any) {
      console.error('Failed to load program performance data:', error);
    } finally {
      this.loading.programs = false;
      this.cdr.markForCheck();
    }
  }

  async loadOperationsSnapshot(): Promise<void> {
    this.loading.operations = true;
    this.cdr.markForCheck();
    try {
      this.operationsSnapshot = await this.apiService.getOperationsSnapshot();
    } catch (error: any) {
      console.error('Failed to load operations snapshot:', error);
    } finally {
      this.loading.operations = false;
      this.cdr.markForCheck();
    }
  }

  async loadEngagementData(): Promise<void> {
    this.loading.engagement = true;
    this.cdr.markForCheck();
    try {
      this.engagementData = await this.apiService.getEngagementData();
    } catch (error: any) {
      console.error('Failed to load engagement data:', error);
    } finally {
      this.loading.engagement = false;
      this.cdr.markForCheck();
    }
  }

  onMemberPeriodChange(period: 'weekly' | 'monthly'): void {
    this.memberPeriod = period;
    this.loadMemberGrowthData();
  }

  formatCurrency(value: number): string {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${value}`;
  }
}

