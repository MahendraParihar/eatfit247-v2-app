import { AfterViewInit, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import {
  IMemberDietPlan,
  IMemberDietDetail,
  ICyclePlan,
  IDropdownItem,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { MemberDietPlanDatasource } from './member-diet-plan.datasource';
import { MemberDietPlanDetailsDialogComponent } from './member-diet-plan-details-dialog/member-diet-plan-details-dialog.component';

// Diet plan status enum (matching shared-lib)
enum DietPlanStatusEnum {
  NOT_STARTED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
}

// Diet type enum (matching shared-lib)
enum DietTypeEnum {
  DAY = 'DAY',
  CYCLE = 'CYCLE',
}

@Component({
  selector: 'lib-member-diet-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './member-diet-plan-list.component.html',
  styleUrl: './member-diet-plan-list.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class MemberDietPlanListComponent implements OnInit, AfterViewInit, OnDestroy {
  memberId!: number;
  totalCount = signal(0);
  list = signal<IMemberDietPlan[]>([]);
  columnsToDisplay: string[] = ['program', 'programCategory', 'noOfCycle', 'dietPlanStatus', 'updatedBy'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  dietPlanStatusEnum = DietPlanStatusEnum;
  dietTypeEnum = DietTypeEnum;
  dietTemplateList = signal<IDropdownItem[]>([]);
  expandArray = signal<boolean[]>([]);
  dataSource!: MemberDietPlanDatasource;
  private destroy$ = new Subject<void>();

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(MembersApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.dataSource = new MemberDietPlanDatasource(this.apiService);
    this.dataSource.totalCount.pipe(takeUntil(this.destroy$)).subscribe((count: number) => this.totalCount.set(count));
    this.dataSource.dietTemplate.pipe(takeUntil(this.destroy$)).subscribe((list: IDropdownItem[]) => this.dietTemplateList.set(list));
    this.dataSource.expanded.pipe(takeUntil(this.destroy$)).subscribe((list: boolean[]) => this.expandArray.set(list));
    this.dataSource.data.pipe(takeUntil(this.destroy$)).subscribe((list: IMemberDietPlan[]) => this.list.set(list));
  }

  async ngOnInit(): Promise<void> {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadData();
      }
    });
  }

  ngAfterViewInit(): void {
    // Material table initialization handled by dataSource
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAddClick(isDaily: boolean, dietPlan: IMemberDietPlan) {
    const planId = (dietPlan as any).memberDietPlanId || (dietPlan as any).id;
    if (isDaily) {
      this.router.navigate(['../diet-plan', planId, 'cycle', dietPlan.upcomingCycle, 'day', dietPlan.upcomingDay], {
        relativeTo: this.route.parent
      });
    } else {
      this.router.navigate(['../diet-plan', planId, 'cycle', dietPlan.upcomingCycle], {
        relativeTo: this.route.parent
      });
    }
  }

  onEditDailyDietPlan(dietPlan: IMemberDietDetail) {
    const planId = (dietPlan as any).dietPlanId;
    if (planId && dietPlan.dayNo) {
      this.router.navigate(['../diet-plan', planId, 'cycle', dietPlan.cycleNo, 'day', dietPlan.dayNo], {
        relativeTo: this.route.parent
      });
    }
  }

  onEditCycleDietPlan(dietPlanId: number, dietPlan: ICyclePlan) {
    this.router.navigate(['../diet-plan', dietPlanId, 'cycle', dietPlan.cycleNo], {
      relativeTo: this.route.parent
    });
  }

  copyCycleDietPlan(dietPlanId: number, cyclePlan: ICyclePlan, dietPlan: IMemberDietPlan) {
    if (dietPlan.upcomingCycle) {
      this.router.navigate(['../diet-plan', dietPlanId, 'cycle', dietPlan.upcomingCycle, 'copy', cyclePlan.cycleNo], {
        relativeTo: this.route.parent
      });
    }
  }

  copyDayDietPlan(dayPlan: IMemberDietDetail, dietPlan: IMemberDietPlan) {
    const planId = (dayPlan as any).dietPlanId;
    if (planId && dietPlan.upcomingCycle && dietPlan.upcomingDay && dayPlan.cycleNo && dayPlan.dayNo) {
      this.router.navigate(['../diet-plan', planId, 'cycle', dietPlan.upcomingCycle, 'day', dietPlan.upcomingDay, 'copy', dayPlan.cycleNo, dayPlan.dayNo], {
        relativeTo: this.route.parent
      });
    }
  }

  onStatusChangeDialog(item: IMemberDietPlan) {
    if (confirm('Are you sure you want to change the status?')) {
      this.updateStatus((item as any).id || item.memberId);
    }
  }

  async onDeleteDietPlan(dietPlan: IMemberDietDetail) {
    if (confirm('Are you sure you want to delete this diet plan?')) {
      await this.deleteDietPlanTask(dietPlan);
    }
  }

  async deleteDietPlanTask(dietPlan: IMemberDietDetail) {
    try {
      const planId = (dietPlan as any).dietPlanId;
      if (!planId) return;
      
      if (dietPlan.dayNo) {
        await this.apiService.deleteDietPlanDay(this.memberId, planId, dietPlan.cycleNo, dietPlan.dayNo);
      } else {
        await this.apiService.deleteDietPlanCycle(this.memberId, planId, dietPlan.cycleNo);
      }
      this.snackBar.open('Diet plan deleted successfully', 'Close', { duration: 3000 });
      this.loadData();
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      this.snackBar.open('Failed to delete diet plan', 'Close', { duration: 3000 });
    }
  }

  async loadData(): Promise<void> {
    await this.dataSource.loadData(this.memberId);
  }

  onViewDietPlanClick(dietPlanDetails: IMemberDietDetail) {
    const dialogRef = this.dialog.open(MemberDietPlanDetailsDialogComponent, {
      width: '550px',
      data: { memberId: this.memberId, dietPlanDetails: dietPlanDetails },
      closeOnNavigation: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  viewCycleDietPlan(cyclePlanItem: ICyclePlan) {
    if (cyclePlanItem.type === 'CYCLE') {
      if (cyclePlanItem.dietPlans && cyclePlanItem.dietPlans.length > 0) {
        this.onViewDietPlanClick(cyclePlanItem.dietPlans[0]);
      }
    }
  }

  async updateStatus(dietPlanId: number | undefined) {
    if (!dietPlanId) return;
    try {
      await this.apiService.updateDietPlanStatus(this.memberId, dietPlanId);
      this.snackBar.open('Status updated successfully', 'Close', { duration: 3000 });
      this.loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
    }
  }

  async downloadDietPlan(dietPlanDetail: ICyclePlan, index: number): Promise<void> {
    try {
      const plan = dietPlanDetail.dietPlans[index];
      if (!plan) return;
      
      const planId = (plan as any).dietPlanId;
      if (!planId) return;
      
      let fileData;
      if (dietPlanDetail.type === DietTypeEnum.CYCLE) {
        fileData = await this.apiService.downloadDietPlanCycle(
          this.memberId,
          planId,
          plan.cycleNo
        );
      } else {
        if (plan.dayNo) {
          fileData = await this.apiService.downloadDietPlanDay(
            this.memberId,
            planId,
            plan.cycleNo,
            plan.dayNo
          );
        }
      }
      if (fileData) {
        this.downloadTemplate(fileData.buffer, fileData.fileName);
      }
    } catch (error) {
      console.error('Error downloading diet plan:', error);
      this.snackBar.open('Failed to download diet plan', 'Close', { duration: 3000 });
    }
  }

  downloadTemplate(base64String: string, fileName: string) {
    if (base64String) {
      const mediaType = 'data:application/pdf;base64,';
      const link = document.createElement('a');
      link.setAttribute('target', '_blank');
      link.setAttribute('href', mediaType + base64String);
      link.setAttribute('download', `${fileName}`);
      link.click();
      link.remove();
    }
  }
}

