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
  private _data: any;
  
  @Input() 
  set data(value: any) {
    if (!value) {
      // If value is null/undefined, create empty structure
      this._data = {
        weight: [],
        bmi: [],
        fat: [],
      };
      ['weight', 'bmi', 'fat'].forEach((metric) => {
        ((this._data as any)[metric] as any).current = null;
        ((this._data as any)[metric] as any).trend = undefined;
      });
      return;
    }
    
    this._data = value;
    // Always transform data when it's set - do it synchronously
    // Check if it needs transformation (has backend structure)
    if (this._data.assessment || this._data.recentLogs || this._data.latestHealthLogs) {
      if (!this._data.weight || (this._data.weight as any).current === undefined) {
        this.transformData();
      }
    } else if (!this._data.weight) {
      // If no backend structure and no weight, create empty structure
      this._data = {
        weight: [],
        bmi: [],
        fat: [],
      };
      ['weight', 'bmi', 'fat'].forEach((metric) => {
        ((this._data as any)[metric] as any).current = null;
        ((this._data as any)[metric] as any).trend = undefined;
      });
    }
  }
  get data(): any {
    // Always return a valid structure - create empty one if needed
    if (!this._data) {
      this._data = {
        weight: [],
        bmi: [],
        fat: [],
      };
      ['weight', 'bmi', 'fat'].forEach((metric) => {
        ((this._data as any)[metric] as any).current = null;
        ((this._data as any)[metric] as any).trend = undefined;
      });
    }
    return this._data;
  }
  
  @Input() memberId!: number;
  @ViewChild('chart', { static: false }) chartRef!: ElementRef;

  private cdr = inject(ChangeDetectorRef);
  private chartInstance: any;
  selectedMetric: MetricType = 'weight';
  loading = false;
  Math = Math;
  EmptyStateType = EmptyStateType;

  ngOnInit(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:53',message:'ngOnInit called',data:{hasData:!!this.data,dataKeys:this.data?Object.keys(this.data):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-4',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    // Ensure data is transformed if it exists on init
    if (this.data) {
      this.transformData();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:56',message:'after transformData in ngOnInit',data:{hasWeight:!!this.data?.weight,weightType:typeof this.data?.weight,isArray:Array.isArray(this.data?.weight),weightCurrent:(this.data?.weight as any)?.current},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-4',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
    }
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
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:71',message:'ngOnChanges called',data:{hasData:!!this.data,dataType:typeof this.data,dataKeys:this.data?Object.keys(this.data):[],hasWeight:!!this.data?.weight,hasBmi:!!this.data?.bmi,hasFat:!!this.data?.fat,weightType:typeof this.data?.weight,bmiType:typeof this.data?.bmi,fatType:typeof this.data?.fat,hasRecentLogs:!!this.data?.recentLogs,recentLogsLength:this.data?.recentLogs?.length,firstLog:this.data?.recentLogs?.[0],latestHealthLogsLength:this.data?.latestHealthLogs?.length,firstLatestLog:this.data?.latestHealthLogs?.[0],hasChangesData:!!changes['data'],loading:this.loading},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-4',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    
    // ALWAYS transform data if it exists, regardless of changes or loading state
    if (this.data) {
      this.transformData();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:75',message:'after transformData in ngOnChanges',data:{hasWeight:!!this.data?.weight,weightType:typeof this.data?.weight,isArray:Array.isArray(this.data?.weight),weightCurrent:(this.data?.weight as any)?.current,weightTrend:(this.data?.weight as any)?.trend},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-4',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
    }
    
    if (changes['data'] && this.data && !this.loading) {
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
    if (!this._data) {
      // Even if no data, create empty structure to prevent template errors
      this._data = {
        weight: [],
        bmi: [],
        fat: [],
      };
      ['weight', 'bmi', 'fat'].forEach((metric) => {
        ((this._data as any)[metric] as any).current = null;
        ((this._data as any)[metric] as any).trend = undefined;
      });
      this.cdr.markForCheck();
      return;
    }

    // Check if data is already in expected format (has weight.current property)
    if (this._data.weight && (this._data.weight as any).current !== undefined) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:120',message:'transformData skipped - already transformed',data:{hasWeight:!!this._data.weight,weightCurrent:(this._data.weight as any)?.current},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-5',hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      return; // Already transformed
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:131',message:'transformData starting',data:{hasRecentLogs:!!this._data.recentLogs,recentLogsLength:this._data.recentLogs?.length,hasLatestHealthLogs:!!this._data.latestHealthLogs,latestHealthLogsLength:this._data.latestHealthLogs?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-5',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion

    // Transform from backend format {assessment, latestHealthLogs, totalLogs, recentLogs}
    // to expected format {weight: [{date, value}], bmi: [{date, value}], fat: [{date, value}], weight: {current, trend}, ...}
    const transformed: any = {
      weight: [],
      bmi: [],
      fat: [],
    };

    // Process both recentLogs and latestHealthLogs to extract weight, BMI, and fat data
    const logsToProcess = [
      ...(this._data.recentLogs && Array.isArray(this._data.recentLogs) ? this._data.recentLogs : []),
      ...(this._data.latestHealthLogs && Array.isArray(this._data.latestHealthLogs) ? this._data.latestHealthLogs : []),
    ];

    logsToProcess.forEach((log: any) => {
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

    // Sort by date
    transformed.weight.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    transformed.bmi.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    transformed.fat.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate current values and trends
    // Add current and trend as properties on the array (arrays are objects in JS)
    ['weight', 'bmi', 'fat'].forEach((metric) => {
      const values = transformed[metric];
      if (values.length > 0) {
        const current = values[values.length - 1].value;
        const previous = values.length > 1 ? values[values.length - 2].value : current;
        const trend = previous !== 0 && previous !== current 
          ? ((current - previous) / previous) * 100 
          : 0;
        
        // Add properties to the array (arrays are objects, so we can add properties)
        (values as any).current = current;
        (values as any).trend = Math.round(trend * 100) / 100; // Round to 2 decimal places
      } else {
        // For empty arrays, still add the properties
        (values as any).current = null;
        (values as any).trend = undefined;
      }
    });

    // Replace data with transformed structure
    this._data = transformed;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:196',message:'transformData completed',data:{weightLength:transformed.weight.length,weightCurrent:(transformed.weight as any).current,weightTrend:(transformed.weight as any).trend,bmiLength:transformed.bmi.length,bmiCurrent:(transformed.bmi as any).current,fatLength:transformed.fat.length,fatCurrent:(transformed.fat as any).current,hasWeight:!!this._data.weight,isWeightArray:Array.isArray(this._data.weight)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-5',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
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

    const metricData = this.data[this.selectedMetric];
    const chartData = Array.isArray(metricData) ? metricData : [];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/07dbdf51-4ad9-4b43-98c1-f0c556815f0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'health-progress.component.ts:182',message:'updateChart called',data:{selectedMetric:this.selectedMetric,hasData:!!this.data,metricDataType:typeof metricData,isArray:Array.isArray(metricData),chartDataLength:chartData.length,firstItem:chartData[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C'})}).catch(()=>{});
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

