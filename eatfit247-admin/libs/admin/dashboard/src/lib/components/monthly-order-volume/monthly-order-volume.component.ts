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
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { DashboardApiService } from '../../api.service';

declare var echarts: any;

@Component({
  selector: 'lib-monthly-order-volume',
  standalone: true,
  imports: [CommonModule, MatCardModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './monthly-order-volume.component.html',
  styleUrl: './monthly-order-volume.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyOrderVolumeComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartRef!: ElementRef;

  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private chartInstance: any;

  data: { month: string; orders: number }[] = [];
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const response = await this.apiService.getMonthlyOrderVolume();
      this.data = response.data;
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
      setTimeout(() => this.initChart(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) this.chartInstance.dispose();
  }

  private initChart(): void {
    if (!this.chartRef?.nativeElement || !this.data.length) return;

    const echartsLib = (window as any).echarts;
    if (!echartsLib) return;

    this.chartInstance = echartsLib.init(this.chartRef.nativeElement);
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chartInstance || !this.data.length) return;

    const isDark = document.body.classList.contains('dark-theme');
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
        textStyle: { color: isDark ? '#e6e6e6' : '#1c1b1f' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: this.data.map((d) => d.month),
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
          name: 'Orders',
          type: 'line',
          smooth: true,
          data: this.data.map((d) => d.orders),
          itemStyle: { color: '#fc2305' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(252, 35, 5, 0.3)' },
                { offset: 1, color: 'rgba(252, 35, 5, 0.05)' },
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
