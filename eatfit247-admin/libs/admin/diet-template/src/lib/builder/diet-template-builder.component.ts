import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { IDietTemplate, IDietTemplateDetail } from '@eatfit247-shared-lib';
import { DietTemplateApiService } from '../api.service';

type CycleType = 'CYCLE' | 'DAY' | 'UNCONFIGURED';

interface DayCell {
  dayNo: number;
  filled: boolean;
}

interface CycleRow {
  cycleNo: number;
  type: CycleType;
  cycleFilled: boolean;
  filledDayCount: number;
  days: DayCell[];
}

@Component({
  selector: 'lib-diet-template-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './diet-template-builder.component.html',
  styleUrl: './diet-template-builder.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DietTemplateBuilderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(DietTemplateApiService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  dietTemplateId!: number;
  template = signal<IDietTemplate | null>(null);
  loading = signal(false);
  expandedCycle = signal<number | null>(null);

  displayedColumns = ['expand', 'cycleNo', 'type', 'summary', 'actions'];

  cycles = computed<CycleRow[]>(() => {
    const t = this.template();
    if (!t) return [];
    const detailsByCycle = new Map<number, IDietTemplateDetail[]>();
    for (const d of t.dietDetails || []) {
      const list = detailsByCycle.get(d.cycleNo) ?? [];
      list.push(d);
      detailsByCycle.set(d.cycleNo, list);
    }
    const rows: CycleRow[] = [];
    for (let c = 1; c <= t.noOfCycle; c++) {
      const list = detailsByCycle.get(c) ?? [];
      const hasCyclePlan = list.some((d) => !d.dayNo);
      const hasDayPlan = list.some((d) => !!d.dayNo);
      const type: CycleType = hasCyclePlan ? 'CYCLE' : hasDayPlan ? 'DAY' : 'UNCONFIGURED';
      const days: DayCell[] = [];
      if (type === 'DAY') {
        for (let day = 1; day <= t.noOfDaysInCycle; day++) {
          days.push({
            dayNo: day,
            filled: list.some((d) => d.dayNo === day),
          });
        }
      }
      rows.push({
        cycleNo: c,
        type,
        cycleFilled: hasCyclePlan,
        filledDayCount: days.filter((d) => d.filled).length,
        days,
      });
    }
    return rows;
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.dietTemplateId = Number(params['dietTemplateId']);
      if (this.dietTemplateId) {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.apiService.getById(this.dietTemplateId);
      this.template.set(data);
    } catch {
      this.snackBar.open('Failed to load diet template', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  toggleExpand(cycle: CycleRow): void {
    if (cycle.type !== 'DAY') return;
    this.expandedCycle.set(this.expandedCycle() === cycle.cycleNo ? null : cycle.cycleNo);
  }

  isExpanded(cycle: CycleRow): boolean {
    return cycle.type === 'DAY' && this.expandedCycle() === cycle.cycleNo;
  }

  editCycle(cycle: CycleRow): void {
    this.router.navigate(['/diet-template/details', this.dietTemplateId, 'cycle', cycle.cycleNo]);
  }

  editDay(cycle: CycleRow, day: DayCell): void {
    this.router.navigate([
      '/diet-template/details',
      this.dietTemplateId,
      'cycle',
      cycle.cycleNo,
      'day',
      day.dayNo,
    ]);
  }

  configureAsCyclePlan(cycle: CycleRow): void {
    this.editCycle(cycle);
  }

  configureAsDayPlan(cycle: CycleRow): void {
    this.router.navigate([
      '/diet-template/details',
      this.dietTemplateId,
      'cycle',
      cycle.cycleNo,
      'day',
      1,
    ]);
  }

  async deleteCycle(cycle: CycleRow): Promise<void> {
    const confirmed = confirm(`Delete Cycle ${cycle.cycleNo} plan?`);
    if (!confirmed) return;
    this.loading.set(true);
    try {
      await this.apiService.deleteCycleDetail(this.dietTemplateId, cycle.cycleNo);
      this.snackBar.open(`Cycle ${cycle.cycleNo} cleared`, 'Close', { duration: 2500 });
      await this.loadData();
    } catch {
      this.snackBar.open('Failed to clear cycle', 'Close', { duration: 3000 });
      this.loading.set(false);
    }
  }

  async deleteDay(cycle: CycleRow, day: DayCell): Promise<void> {
    const confirmed = confirm(
      `Delete Cycle ${cycle.cycleNo} Day ${day.dayNo}?`,
    );
    if (!confirmed) return;
    this.loading.set(true);
    try {
      await this.apiService.deleteDayDetail(this.dietTemplateId, cycle.cycleNo, day.dayNo);
      this.snackBar.open(`Day ${day.dayNo} cleared`, 'Close', { duration: 2500 });
      await this.loadData();
    } catch {
      this.snackBar.open('Failed to clear day', 'Close', { duration: 3000 });
      this.loading.set(false);
    }
  }

  nextEmptyDayInCycle(cycleNo: number, sourceDayNo: number): number | null {
    const cycle = this.cycles().find((c) => c.cycleNo === cycleNo);
    if (!cycle || cycle.type !== 'DAY') return null;
    const next = cycle.days.find((d) => d.dayNo > sourceDayNo && !d.filled);
    return next?.dayNo ?? null;
  }

  nextEmptyCycleAfter(sourceCycleNo: number): number | null {
    const next = this.cycles().find(
      (c) => c.cycleNo > sourceCycleNo && c.type === 'UNCONFIGURED',
    );
    return next?.cycleNo ?? null;
  }

  canCopyDay(cycle: CycleRow, day: DayCell): boolean {
    return day.filled && this.nextEmptyDayInCycle(cycle.cycleNo, day.dayNo) !== null;
  }

  canCopyCycle(cycle: CycleRow): boolean {
    return this.nextEmptyCycleAfter(cycle.cycleNo) !== null;
  }

  copyDay(cycle: CycleRow, day: DayCell): void {
    const targetDay = this.nextEmptyDayInCycle(cycle.cycleNo, day.dayNo);
    if (!targetDay) return;
    this.router.navigate([
      '/diet-template/details',
      this.dietTemplateId,
      'cycle',
      cycle.cycleNo,
      'day',
      targetDay,
      'copy',
      cycle.cycleNo,
      day.dayNo,
    ]);
  }

  copyCycle(cycle: CycleRow): void {
    const targetCycle = this.nextEmptyCycleAfter(cycle.cycleNo);
    if (!targetCycle) return;
    this.router.navigate([
      '/diet-template/details',
      this.dietTemplateId,
      'cycle',
      targetCycle,
      'copy',
      cycle.cycleNo,
    ]);
  }

  back(): void {
    this.router.navigate(['/diet-template']);
  }
}
