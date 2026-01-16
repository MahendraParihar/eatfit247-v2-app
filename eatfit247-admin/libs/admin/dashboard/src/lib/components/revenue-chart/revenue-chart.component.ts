import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { RevenueData } from '../../api.service';

declare var echarts: any;

@Component({
  selector: 'lib-revenue-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTabsModule, LoaderComponent, EmptyStateComponent],
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data?: RevenueData;
  @Input() loading = false;
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef;
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef;

  private lineChartInstance: any;
  private barChartInstance: any;
  selectedTab = 0;

  ngOnInit(): void {
    if (typeof window !== 'undefined' && (window as any).echarts) {
      this.initCharts();
    }
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.lineChartInstance) {
      this.lineChartInstance.dispose();
    }
    if (this.barChartInstance) {
      this.barChartInstance.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && !this.loading) {
      setTimeout(() => this.updateCharts(), 100);
    }
  }

  private initCharts(): void {
    if (this.lineChartRef?.nativeElement) {
      this.lineChartInstance = echarts.init(this.lineChartRef.nativeElement);
      this.updateLineChart();
    }
    if (this.barChartRef?.nativeElement) {
      this.barChartInstance = echarts.init(this.barChartRef.nativeElement);
      this.updateBarChart();
    }
  }

  private updateCharts(): void {
    if (!this.data) return;

    if (this.lineChartInstance) {
      this.updateLineChart();
    } else if (this.lineChartRef?.nativeElement) {
      this.initCharts();
    }

    if (this.barChartInstance) {
      this.updateBarChart();
    } else if (this.barChartRef?.nativeElement) {
      this.initCharts();
    }
  }

  private updateLineChart(): void {
    if (!this.data?.lineChart || !this.lineChartInstance) return;

    const isDark = document.body.classList.contains('dark-theme');
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
        textStyle: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: this.data.lineChart.map((d) => d.month),
        axisLine: {
          lineStyle: {
            color: isDark ? '#3a3a3a' : '#e0e0e0',
          },
        },
        axisLabel: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: isDark ? '#3a3a3a' : '#e0e0e0',
          },
        },
        axisLabel: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
          formatter: (value: number) => `₹${(value / 1000).toFixed(0)}k`,
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#2a2a2a' : '#f7f7f7',
          },
        },
      },
      series: [
        {
          name: 'Revenue',
          type: 'line',
          smooth: true,
          data: this.data.lineChart.map((d) => d.revenue),
          itemStyle: {
            color: '#fc2305',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(252, 35, 5, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(252, 35, 5, 0.05)',
                },
              ],
            },
          },
        },
      ],
    };

    this.lineChartInstance.setOption(option);
    this.lineChartInstance.resize();
  }

  private updateBarChart(): void {
    if (!this.data?.barChart || !this.barChartInstance) return;

    const isDark = document.body.classList.contains('dark-theme');
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
        textStyle: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
      },
      legend: {
        data: ['Paid', 'Pending'],
        textStyle: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
        top: 10,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: this.data.barChart.map((d) => d.month),
        axisLine: {
          lineStyle: {
            color: isDark ? '#3a3a3a' : '#e0e0e0',
          },
        },
        axisLabel: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: isDark ? '#3a3a3a' : '#e0e0e0',
          },
        },
        axisLabel: {
          color: isDark ? '#e6e6e6' : '#1c1b1f',
          formatter: (value: number) => `₹${(value / 1000).toFixed(0)}k`,
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#2a2a2a' : '#f7f7f7',
          },
        },
      },
      series: [
        {
          name: 'Paid',
          type: 'bar',
          stack: 'total',
          data: this.data.barChart.map((d) => d.paid),
          itemStyle: {
            color: '#1b8f5a',
          },
        },
        {
          name: 'Pending',
          type: 'bar',
          stack: 'total',
          data: this.data.barChart.map((d) => d.pending),
          itemStyle: {
            color: '#f29900',
          },
        },
      ],
    };

    this.barChartInstance.setOption(option);
    this.barChartInstance.resize();
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    setTimeout(() => {
      if (index === 0 && this.lineChartInstance) {
        this.lineChartInstance.resize();
      } else if (index === 1 && this.barChartInstance) {
        this.barChartInstance.resize();
      }
    }, 100);
  }

  @HostListener('window:resize', ['$event'])
  onResize = (): void => {
    if (this.lineChartInstance) {
      this.lineChartInstance.resize();
    }
    if (this.barChartInstance) {
      this.barChartInstance.resize();
    }
  };
}

