import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { IMemberGrowthData } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

declare var echarts: any;

@Component({
  selector: 'lib-member-growth-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonToggleModule,
    FormsModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './member-growth-chart.component.html',
  styleUrl: './member-growth-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberGrowthChartComponent implements OnInit, OnDestroy {
  @ViewChild('chart', { static: false }) chartRef!: ElementRef;

  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private chartInstance: any;

  data?: IMemberGrowthData;
  loading = false;
  selectedPeriod: 'weekly' | 'monthly' = 'monthly';

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) this.chartInstance.dispose();
  }

  async onPeriodToggle(period: 'weekly' | 'monthly'): Promise<void> {
    this.selectedPeriod = period;
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getMemberGrowthData(this.selectedPeriod);
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
      setTimeout(() => this.updateChart(), 100);
    }
  }

  private updateChart(): void {
    if (!this.data?.data) return;

    if (!this.chartInstance && this.chartRef?.nativeElement) {
      this.chartInstance = echarts.init(this.chartRef.nativeElement);
    }
    if (!this.chartInstance) return;

    const isDark = document.body.classList.contains('dark-theme');
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
        textStyle: { color: isDark ? '#e6e6e6' : '#1c1b1f' },
      },
      legend: {
        data: ['New Members', 'Active Members'],
        textStyle: { color: isDark ? '#e6e6e6' : '#1c1b1f' },
        top: 10,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: this.data.data.map((d) => d.period),
        axisLine: { lineStyle: { color: isDark ? '#3a3a3a' : '#e0e0e0' } },
        axisLabel: { color: isDark ? '#e6e6e6' : '#1c1b1f' },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: isDark ? '#3a3a3a' : '#e0e0e0' } },
        axisLabel: { color: isDark ? '#e6e6e6' : '#1c1b1f' },
        splitLine: { lineStyle: { color: isDark ? '#2a2a2a' : '#f7f7f7' } },
      },
      series: [
        {
          name: 'New Members', type: 'line', smooth: true,
          data: this.data.data.map((d) => d.newMembers),
          itemStyle: { color: '#1976d2' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(25, 118, 210, 0.3)' },
                { offset: 1, color: 'rgba(25, 118, 210, 0.05)' },
              ],
            },
          },
        },
        {
          name: 'Active Members', type: 'line', smooth: true,
          data: this.data.data.map((d) => d.activeMembers),
          itemStyle: { color: '#1b8f5a' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(27, 143, 90, 0.3)' },
                { offset: 1, color: 'rgba(27, 143, 90, 0.05)' },
              ],
            },
          },
        },
      ],
    };

    this.chartInstance.setOption(option);
    this.chartInstance.resize();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.chartInstance) this.chartInstance.resize();
  }
}
