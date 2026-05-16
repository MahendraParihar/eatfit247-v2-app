import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { DietPlanStatusEnum, IMemberDietPlan } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';

@Component({
  selector: 'lib-member-diet-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './member-diet-history.component.html',
  styleUrl: './member-diet-history.component.scss'
})
export class MemberDietHistoryComponent implements OnInit, OnDestroy {
  memberId!: number;
  totalCount = signal(0);
  list = signal<IMemberDietPlan[]>([]);
  columnsToDisplay: string[] = ['program', 'noOfCycle', 'dietPlanStatus', 'startDate', 'endDate', 'updatedBy'];
  dietPlanStatusEnum = DietPlanStatusEnum;
  loading = signal(false);
  private destroy$ = new Subject<void>();

  private route = inject(ActivatedRoute);
  private apiService = inject(MembersApiService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
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
      // Filter to show only completed diet plans for history
      const response = await this.apiService.getDietPlans(this.memberId);
      // Filter to show only completed plans
      const completedPlans = response.list.filter(
        plan => plan.dietPlanStatusId === DietPlanStatusEnum.COMPLETED
      );
      this.list.set(completedPlans);
      this.totalCount.set(completedPlans.length);
    } catch (error) {
      this.snackBar.open('Failed to load diet history', 'Close', { duration: 3000 });
      this.list.set([]);
      this.totalCount.set(0);
    } finally {
      this.loading.set(false);
    }
  }
}
