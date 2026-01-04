import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LoaderComponent } from '@shared';
import { EmptyStateComponent } from '@shared';
import { ProgramPerformanceData } from '../../api.service';

declare var echarts: any;

@Component({
  selector: 'lib-program-performance-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './program-performance-chart.component.html',
  styleUrl: './program-performance-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramPerformanceChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data?: ProgramPerformanceData[];
  @Input() loading = false;
  @ViewChild('chart', { static: false }) chartRef!: ElementRef;

  private chartInstance: any;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && (window as any).echarts) {
      this.initChart();
    }
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && !this.loading) {
      setTimeout(() => this.updateChart(), 100);
    }
  }

  private initChart(): void {
    if (this.chartRef?.nativeElement) {
      this.chartInstance = echarts.init(this.chartRef.nativeElement);
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.data || this.data.length === 0 || !this.chartInstance) return;

    const top5 = this.data.slice(0, 5);
    const isDark = document.body.classList.contains('dark-theme');
    const colors = ['#fc2305', '#1976d2', '#1b8f5a', '#f29900', '#9c27b0'];

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
        textStyle: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
        formatter: (params: any) => {
          return `${params.name}<br/>${params.seriesName}: ${params.value} (${params.percent}%)`;
        },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: top5.map((d) => d.programName),
        textStyle: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
      },
      series: [
        {
          name: 'Enrollment',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 0,
            borderColor: isDark ? '#121212' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: isDark ? '#e6e6e6' : '#1c1b1f',
            },
          },
          labelLine: {
            show: false,
          },
          data: top5.map((d, index) => ({
            value: d.enrollment,
            name: d.programName,
            itemStyle: {
              color: colors[index % colors.length],
            },
          })),
        },
      ],
    };

    this.chartInstance.setOption(option);
    this.chartInstance.resize();
  }

  @HostListener('window:resize', ['$event'])
  onResize = (): void => {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  };
}

