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
import { IProgramPerformanceData } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

declare var echarts: any;

@Component({
  selector: 'lib-program-performance-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './program-performance-chart.component.html',
  styleUrl: './program-performance-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramPerformanceChartComponent implements OnInit, OnDestroy {
  @ViewChild('chart', { static: false }) chartRef!: ElementRef;

  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private chartInstance: any;

  data?: IProgramPerformanceData[];
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getProgramPerformanceData();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
      setTimeout(() => this.updateChart(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) this.chartInstance.dispose();
  }

  private getCssVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private updateChart(): void {
    if (!this.data || this.data.length === 0) return;

    if (!this.chartInstance && this.chartRef?.nativeElement) {
      this.chartInstance = echarts.init(this.chartRef.nativeElement);
    }
    if (!this.chartInstance) return;

    const top5 = this.data.slice(0, 5);
    const colors = [
      this.getCssVariable('--md-sys-color-primary'),
      this.getCssVariable('--status-info'),
      this.getCssVariable('--status-success'),
      this.getCssVariable('--status-warning'),
      this.getCssVariable('--md-sys-color-tertiary'),
    ];

    const surfaceColor = this.getCssVariable('--md-sys-color-surface');
    const outlineColor = this.getCssVariable('--md-sys-color-outline');
    const onSurfaceColor = this.getCssVariable('--md-sys-color-on-surface');

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: surfaceColor,
        borderColor: outlineColor,
        textStyle: { color: onSurfaceColor },
        formatter: (params: any) =>
          `${params.name}<br/>${params.seriesName}: ${params.value} (${params.percent}%)`,
      },
      legend: {
        orient: 'vertical', left: 'left',
        data: top5.map((d) => d.programName),
        textStyle: { color: onSurfaceColor },
      },
      series: [
        {
          name: 'Enrollment', type: 'pie', radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 0, borderColor: surfaceColor, borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold', color: onSurfaceColor },
          },
          labelLine: { show: false },
          data: top5.map((d, index) => ({
            value: d.enrollment,
            name: d.programName,
            itemStyle: { color: colors[index % colors.length] },
          })),
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
