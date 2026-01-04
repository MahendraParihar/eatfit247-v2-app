import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LoaderComponent, EmptyStateComponent, EmptyStateType } from '@shared';

declare var echarts: any;

type MetricType = 'weight' | 'bmi' | 'fat';

@Component({
  selector: 'lib-health-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonToggleModule,
    FormsModule,
    MatIconModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './health-progress.component.html',
  styleUrl: './health-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthProgressComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: any;
  @Input() memberId!: number;
  @ViewChild('chart', { static: false }) chartRef!: ElementRef;

  private cdr = inject(ChangeDetectorRef);
  private chartInstance: any;
  selectedMetric: MetricType = 'weight';
  loading = false;
  Math = Math;
  EmptyStateType = EmptyStateType;

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:67',message:'ngOnChanges called',data:{hasData:!!this.data,dataType:typeof this.data,dataKeys:this.data?Object.keys(this.data):[],hasWeight:!!this.data?.weight,hasBmi:!!this.data?.bmi,hasFat:!!this.data?.fat,weightType:typeof this.data?.weight,bmiType:typeof this.data?.bmi,fatType:typeof this.data?.fat,hasRecentLogs:!!this.data?.recentLogs,recentLogsLength:this.data?.recentLogs?.length,firstLog:this.data?.recentLogs?.[0],latestHealthLogsLength:this.data?.latestHealthLogs?.length,firstLatestLog:this.data?.latestHealthLogs?.[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    if (changes['data'] && this.data && !this.loading) {
      // Transform backend data structure to expected format
      this.transformData();
      setTimeout(() => {
        if (this.chartInstance) {
          this.updateChart();
        } else if (this.chartRef?.nativeElement && typeof window !== 'undefined' && (window as any).echarts) {
          this.initChart();
        }
      }, 100);
    }
  }

  private transformData(): void {
    if (!this.data) return;

    // Check if data is already in expected format
    if (this.data.weight && Array.isArray(this.data.weight)) {
      return; // Already transformed
    }

    // Transform from backend format {assessment, latestHealthLogs, totalLogs, recentLogs}
    // to expected format {weight: [{date, value}], bmi: [{date, value}], fat: [{date, value}], weight: {current, trend}, ...}
    const transformed: any = {
      weight: [],
      bmi: [],
      fat: [],
    };

    // Process recentLogs to extract weight, BMI, and fat data
    if (this.data.recentLogs && Array.isArray(this.data.recentLogs)) {
      this.data.recentLogs.forEach((log: any) => {
        if (log.healthParameters && Array.isArray(log.healthParameters)) {
          log.healthParameters.forEach((param: any) => {
            const paramName = param.healthParameter?.healthParameter || param.healthParameter || '';
            const value = parseFloat(param.value);
            if (isNaN(value)) return;

            const date = log.logDate || log.date;
            const dataPoint = { date, value, period: date };

            // Match by parameter name (case-insensitive)
            const lowerName = paramName.toLowerCase();
            if (lowerName.includes('weight')) {
              transformed.weight.push(dataPoint);
            } else if (lowerName.includes('bmi')) {
              transformed.bmi.push(dataPoint);
            } else if (lowerName.includes('fat') || lowerName.includes('body fat')) {
              transformed.fat.push(dataPoint);
            }
          });
        }
      });
    }

    // Sort by date
    transformed.weight.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    transformed.bmi.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    transformed.fat.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate current values and trends
    ['weight', 'bmi', 'fat'].forEach((metric) => {
      const values = transformed[metric];
      if (values.length > 0) {
        const current = values[values.length - 1].value;
        const previous = values.length > 1 ? values[values.length - 2].value : current;
        const trend = previous !== 0 && previous !== current 
          ? ((current - previous) / previous) * 100 
          : 0;
        
        transformed[metric] = {
          ...transformed[metric],
          current,
          trend: Math.round(trend * 100) / 100, // Round to 2 decimal places
        };
      } else {
        transformed[metric] = {
          current: null,
          trend: undefined,
        };
      }
    });

    // Replace data with transformed structure
    this.data = transformed;
    this.cdr.markForCheck();
  }

  onMetricChange(metric: MetricType): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:79',message:'onMetricChange called',data:{metric,hasData:!!this.data,selectedMetricData:this.data?this.data[metric]:undefined,selectedMetricDataType:typeof this.data?.[metric],isArray:Array.isArray(this.data?.[metric])},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    this.selectedMetric = metric;
    if (this.chartInstance) {
      this.updateChart();
    } else if (this.chartRef?.nativeElement && typeof window !== 'undefined' && (window as any).echarts) {
      this.initChart();
    }
  }

  private onResize = (): void => {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  };

  private initChart(): void {
    if (this.chartRef?.nativeElement) {
      this.chartInstance = echarts.init(this.chartRef.nativeElement);
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.data || !this.chartInstance) return;

    const chartData = this.data[this.selectedMetric] || [];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:101',message:'updateChart called',data:{selectedMetric:this.selectedMetric,hasData:!!this.data,chartDataLength:chartData.length,chartDataType:typeof chartData,isArray:Array.isArray(chartData),firstItem:chartData[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
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
        data: chartData.map((d: any) => d.date || d.period),
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
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#2a2a2a' : '#f7f7f7',
          },
        },
      },
      series: [
        {
          name: this.getMetricLabel(),
          type: 'line',
          smooth: true,
          data: chartData.map((d: any) => d.value),
          itemStyle: {
            color: isDark ? '#d0bcff' : '#6750a4',
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
                  color: isDark ? 'rgba(103, 80, 164, 0.3)' : 'rgba(103, 80, 164, 0.3)',
                },
                {
                  offset: 1,
                  color: isDark ? 'rgba(103, 80, 164, 0.05)' : 'rgba(103, 80, 164, 0.05)',
                },
              ],
            },
          },
        },
      ],
    };

    this.chartInstance.setOption(option);
    this.cdr.markForCheck();
  }

  private getMetricLabel(): string {
    const labels: Record<MetricType, string> = {
      weight: 'Weight (kg)',
      bmi: 'BMI',
      fat: 'Fat %',
    };
    return labels[this.selectedMetric];
  }

  get currentValue(): number | null {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:196',message:'currentValue getter called',data:{hasData:!!this.data,selectedMetric:this.selectedMetric,hasSelectedMetric:!!this.data?.[this.selectedMetric],selectedMetricType:typeof this.data?.[this.selectedMetric],isArray:Array.isArray(this.data?.[this.selectedMetric])},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    if (!this.data || !this.data[this.selectedMetric]) return null;
    const values = this.data[this.selectedMetric];
    return values.length > 0 ? values[values.length - 1].value : null;
  }

  get previousValue(): number | null {
    if (!this.data || !this.data[this.selectedMetric]) return null;
    const values = this.data[this.selectedMetric];
    return values.length > 1 ? values[values.length - 2].value : null;
  }

  get trend(): number | null {
    const current = this.currentValue;
    const previous = this.previousValue;
    if (current === null || previous === null || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }
}

