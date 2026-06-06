import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  createdByUserFormatter,
  EmptyStateComponent,
  EmptyStateType,
  ITableActionButton,
  ITableColumn,
  ITableConfig,
  LoaderComponent,
  updatedByUserFormatter
} from '@shared';
import { MembersApiService } from '../../api.service';
import { MemberDietPlanDatasource } from './member-diet-plan.datasource';
import {
  MemberDietPlanDetailsDialogComponent
} from './member-diet-plan-details-dialog/member-diet-plan-details-dialog.component';
import {
  DietPlanStatusEnum,
  DietTypeEnum,
  ICyclePlan,
  IMemberDietDetail,
  IMemberDietPlan
} from '@eatfit247-shared-lib';

@Component({
  selector: "lib-member-diet-plan-list",
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    LoaderComponent,
    EmptyStateComponent
  ],
  templateUrl: "./member-diet-plan-list.component.html",
  styleUrl: "./member-diet-plan-list.component.scss",
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      )
    ])
  ]
})
export class MemberDietPlanListComponent implements OnInit, OnDestroy {
  memberId!: number;
  list = signal<IMemberDietPlan[]>([]);
  loading = signal(false);
  dataSource!: MemberDietPlanDatasource;
  EmptyStateType = EmptyStateType;
  tableConfig!: ITableConfig<IMemberDietPlan>;
  displayedColumns = [
    "program",
    "noOfCycle",
    "dietPlanStatus",
    "updatedBy",
    "actions"
  ];
  columnsToDisplayWithExpand = [...this.displayedColumns];
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(MembersApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  completedPlanStatus = DietPlanStatusEnum.COMPLETED;
  dietTypeEnum = DietTypeEnum;
  dietPlanStatusEnum = DietPlanStatusEnum;

  constructor() {
    this.dataSource = new MemberDietPlanDatasource();
    this.dataSource.data
      .pipe(takeUntil(this.destroy$))
      .subscribe((list: IMemberDietPlan[]) => {
        // Add isExpanded property to each row
        const listWithExpand = list.map((item) => {
          const isSmall = this.isChildListSmall(item);
          return {
            ...item,
            isExpanded: isSmall // Auto-expand if child list is small
          } as IMemberDietPlan & {
            isExpanded: boolean;
          };
        });
        this.list.set(listWithExpand);
      });
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberDietPlan>[] = [
      {
        key: "expand",
        label: "",
        dataKey: "",
        sortable: false,
        width: "50px"
      },
      {
        key: "program",
        label: "Program",
        dataKey: "program",
        sortable: false
      },
      {
        key: "noOfCycle",
        label: "No. of Cycles",
        dataKey: "noOfCycle",
        type: "number",
        sortable: false
      },
      {
        key: "currentCycleNo",
        label: "Current Cycle",
        dataKey: "currentCycleNo",
        type: "number",
        sortable: false
      },
      {
        key: "currentDayNo",
        label: "Current Day",
        dataKey: "currentDayNo",
        type: "number",
        sortable: false
      },
      {
        key: "dietPlanStatus",
        label: "Status",
        dataKey: "dietPlanStatus",
        sortable: false
      },
      {
        key: "createdByUser",
        label: "Created By",
        dataKey: "createdByUser",
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: "updatedByUser",
        label: "Updated By",
        dataKey: "updatedByUser",
        sortable: false,
        formatter: updatedByUserFormatter()
      },
      {
        key: "createdAt",
        label: "Created At",
        dataKey: "createdAt",
        type: "date",
        sortable: false
      },
      {
        key: "updatedAt",
        label: "Updated At",
        dataKey: "updatedAt",
        type: "date",
        sortable: false
      }
    ];
    const actions: ITableActionButton<IMemberDietPlan>[] = [
      {
        label: "Add Day Plan",
        icon: "add",
        color: "primary",
        tooltip: "Add Day Plan",
        visible: (row) => row.showDaily,
        onClick: (row) => this.onAddClick(true, row),
        asMenuItem: true
      },
      {
        label: "Add Cycle Plan",
        icon: "add",
        color: "primary",
        tooltip: "Add Cycle Plan",
        visible: (row) => row.showWeekly,
        onClick: (row) => this.onAddClick(false, row),
        asMenuItem: true
      },
      {
        label: "Mark as In Progress",
        icon: "pending",
        color: "primary",
        tooltip: "Mark as In Progress",
        visible: (row) => row.dietPlanStatusId === DietPlanStatusEnum.NOT_STARTED,
        onClick: (row) => this.onStatusChangeDialog(row, DietPlanStatusEnum.IN_PROGRESS),
        confirm: {
          message: "Are you sure you want to mark this diet plan as In Progress?",
          confirmText: "Yes",
          cancelText: "No"
        },
        asMenuItem: true
      },
      {
        label: "Mark as Completed",
        icon: "check_circle",
        color: "primary",
        tooltip: "Mark as Completed",
        visible: (row) => row.dietPlanStatusId !== this.completedPlanStatus,
        onClick: (row) => this.onStatusChangeDialog(row, DietPlanStatusEnum.COMPLETED),
        confirm: {
          message: "Are you sure you want to mark this diet plan as Completed?",
          confirmText: "Yes",
          cancelText: "No"
        },
        asMenuItem: true
      },
      {
        label: "Edit",
        icon: "edit",
        color: "primary",
        tooltip: "Edit Diet Plan",
        visible: (row) => {
          return !!(
            row.cyclePlans &&
            row.cyclePlans.length > 0 &&
            row.upcomingCycle
          );
        },
        onClick: (row) => this.onEditDietPlanFromRow(row)
      }
    ];
    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      showSearch: false,
      actionsConfig: {
        buttons: actions,
        column: {
          headerLabel: "Actions",
          align: "right",
          asMenu: true,
          menuTriggerIcon: "more_vert"
        }
      }
    };
  }

  async ngOnInit(): Promise<void> {
    this.initializeTable();
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.memberId = +params["id"];
        if (this.memberId) {
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAddClick(isDaily: boolean, dietPlan: IMemberDietPlan) {
    const planId = dietPlan.memberDietPlanId;
    if (isDaily) {
      this.router.navigate(
        [
          "diet-plan",
          planId,
          "cycle",
          dietPlan.upcomingCycle,
          "day",
          dietPlan.upcomingDay
        ],
        {
          relativeTo: this.route.parent
        }
      );
    } else {
      this.router.navigate(
        ["diet-plan", planId, "cycle", dietPlan.upcomingCycle],
        {
          relativeTo: this.route.parent
        }
      );
    }
  }

  onEditDailyDietPlan(dietPlan: IMemberDietDetail) {
    const planId = dietPlan.memberDietPlanId;
    if (planId && dietPlan.dayNo) {
      this.router.navigate(
        ["diet-plan", planId, "cycle", dietPlan.cycleNo, "day", dietPlan.dayNo],
        {
          relativeTo: this.route.parent
        }
      );
    }
  }

  onEditCycleDietPlan(dietPlanId: number, dietPlan: ICyclePlan) {
    this.router.navigate(["diet-plan", dietPlanId, "cycle", dietPlan.cycleNo], {
      relativeTo: this.route.parent
    });
  }

  copyCycleDietPlan(cyclePlan: ICyclePlan, dietPlan: IMemberDietPlan) {
    if (dietPlan.upcomingCycle) {
      this.router.navigate(
        [
          "diet-plan",
          dietPlan.memberDietPlanId,
          "cycle",
          dietPlan.upcomingCycle,
          "copy",
          cyclePlan.cycleNo
        ],
        {
          relativeTo: this.route.parent
        }
      );
    }
  }

  copyDayDietPlan(cyclePlan: IMemberDietDetail, dietPlan: IMemberDietPlan) {
    if (
      dietPlan.memberDietPlanId &&
      dietPlan.upcomingCycle &&
      dietPlan.upcomingDay &&
      cyclePlan.cycleNo &&
      cyclePlan.dayNo
    ) {
      this.router.navigate(
        [
          "diet-plan",
          dietPlan.memberDietPlanId,
          "cycle",
          dietPlan.upcomingCycle,
          "day",
          dietPlan.upcomingDay,
          "copy",
          cyclePlan.cycleNo,
          cyclePlan.dayNo
        ],
        {
          relativeTo: this.route.parent
        }
      );
    }
  }

  onStatusChangeDialog(item: IMemberDietPlan, statusId?: number) {
    if (confirm("Are you sure you want to change the status?")) {
      this.updateStatus(item.memberDietPlanId, statusId);
    }
  }

  async onDeleteDietPlan(dietPlan: IMemberDietDetail) {
    if (confirm("Are you sure you want to delete this diet plan?")) {
      await this.deleteDietPlanTask(dietPlan);
    }
  }

  async deleteDietPlanTask(dietPlan: IMemberDietDetail) {
    try {
      const planId = dietPlan.memberDietPlanId;
      if (!planId) return;
      if (dietPlan.dayNo) {
        await this.apiService.deleteDietPlanDay(
          this.memberId,
          planId,
          dietPlan.cycleNo,
          dietPlan.dayNo
        );
      } else {
        await this.apiService.deleteDietPlanCycle(
          this.memberId,
          planId,
          dietPlan.cycleNo
        );
      }
      this.snackBar.open("Diet plan deleted successfully", "Close", {
        duration: 3000
      });
      this.loadData();
    } catch (error) {
      this.snackBar.open("Failed to delete diet plan", "Close", {
        duration: 3000
      });
    }
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      await this.dataSource.loadData(this.memberId);
    } finally {
      this.loading.set(false);
    }
  }

  onViewDietPlanClick(dietPlanDetails: IMemberDietDetail) {
    const dialogRef = this.dialog.open(MemberDietPlanDetailsDialogComponent, {
      width: "800px",
      maxWidth: "90vw",
      data: { memberId: this.memberId, dietPlanDetails: dietPlanDetails },
      closeOnNavigation: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  viewCycleDietPlan(cyclePlanItem: ICyclePlan) {
    if (cyclePlanItem.type === "CYCLE") {
      if (cyclePlanItem.dietPlans && cyclePlanItem.dietPlans.length > 0) {
        this.onViewDietPlanClick(cyclePlanItem.dietPlans[0]);
      }
    }
  }

  async updateStatus(dietPlanId: number | undefined, statusId?: number) {
    if (!dietPlanId) return;
    try {
      await this.apiService.updateDietPlanStatus(this.memberId, dietPlanId, statusId);
      this.snackBar.open("Status updated successfully", "Close", {
        duration: 3000
      });
      this.loadData();
    } catch (error) {
      this.snackBar.open("Failed to update status", "Close", {
        duration: 3000
      });
    }
  }

  async downloadDietPlan(
    dietPlanDetail: ICyclePlan,
    index: number
  ): Promise<void> {
    try {
      const plan = dietPlanDetail.dietPlans[index];
      if (!plan) return;
      const planId = plan.memberDietPlanId;
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
      this.snackBar.open("Failed to download diet plan", "Close", {
        duration: 3000
      });
    }
  }

  downloadTemplate(base64String: string, fileName: string) {
    if (base64String) {
      const mediaType = "data:application/pdf;base64,";
      const link = document.createElement("a");
      link.setAttribute("target", "_blank");
      link.setAttribute("href", mediaType + base64String);
      link.setAttribute("download", `${fileName}`);
      link.click();
      link.remove();
    }
  }

  async onDownloadDietPlanFromRow(row: IMemberDietPlan): Promise<void> {
    try {
      if (!row.cyclePlans || row.cyclePlans.length === 0) {
        this.snackBar.open("No diet plan details available", "Close", {
          duration: 3000
        });
        return;
      }
      // Get the first cycle plan
      const firstCycle = row.cyclePlans[0] as ICyclePlan;
      if (
        !firstCycle ||
        !firstCycle.dietPlans ||
        firstCycle.dietPlans.length === 0
      ) {
        this.snackBar.open("No diet plan details available", "Close", {
          duration: 3000
        });
        return;
      }
      // Download the first diet plan in the first cycle
      await this.downloadDietPlan(firstCycle, 0);
    } catch (error) {
      this.snackBar.open("Failed to download diet plan", "Close", {
        duration: 3000
      });
    }
  }

  onEditDietPlanFromRow(row: IMemberDietPlan): void {
    const planId = row.memberDietPlanId;
    if (!planId) {
      this.snackBar.open("Invalid diet plan", "Close", { duration: 3000 });
      return;
    }
    if (row.upcomingCycle && row.upcomingDay) {
      // Navigate to day plan edit
      this.router.navigate(
        [
          "diet-plan",
          planId,
          "cycle",
          row.upcomingCycle,
          "day",
          row.upcomingDay
        ],
        {
          relativeTo: this.route.parent
        }
      );
    } else if (row.upcomingCycle) {
      // Navigate to cycle plan edit
      this.router.navigate(["diet-plan", planId, "cycle", row.upcomingCycle], {
        relativeTo: this.route.parent
      });
    } else if (row.cyclePlans && row.cyclePlans.length > 0) {
      // Use the first cycle
      const firstCycle = row.cyclePlans[0] as ICyclePlan;
      if (firstCycle.dietPlans && firstCycle.dietPlans.length > 0) {
        const firstDietPlan = firstCycle.dietPlans[0] as IMemberDietDetail;
        if (firstDietPlan.dayNo) {
          this.onEditDailyDietPlan(firstDietPlan);
        } else {
          this.onEditCycleDietPlan(planId, firstCycle);
        }
      }
    }
  }

  hasCyclePlans(row: IMemberDietPlan): boolean {
    return row.cyclePlans && row.cyclePlans.length > 0;
  }

  async onDownloadCyclePlan(
    cyclePlan: ICyclePlan,
    _row: IMemberDietPlan
  ): Promise<void> {
    await this.downloadDietPlan(cyclePlan, 0);
  }

  onEditCyclePlan(cyclePlan: ICyclePlan, row: IMemberDietPlan): void {
    const planId = row.memberDietPlanId;
    if (!planId) return;
    this.onEditCycleDietPlan(planId, cyclePlan);
  }

  async onDeleteCyclePlan(
    cyclePlan: ICyclePlan,
    _row: IMemberDietPlan
  ): Promise<void> {
    if (!cyclePlan.dietPlans || cyclePlan.dietPlans.length === 0) return;
    const dietPlan = cyclePlan.dietPlans[0] as IMemberDietDetail;
    if (confirm("Are you sure you want to delete this diet plan?")) {
      await this.deleteDietPlanTask(dietPlan);
    }
  }

  formatDateRange(startDate: string | Date, endDate: string | Date): string {
    // Parse only the YYYY-MM-DD calendar portion so display is not shifted
    // by the viewer's timezone (DATEONLY values arrive as date-only or
    // as a midnight ISO timestamp; we want the calendar day either way).
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formatDate = (value: string | Date) => {
      const iso = value instanceof Date ? value.toISOString() : String(value);
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      if (!match) return String(value);
      const [, year, month, day] = match;
      return `${day}-${MONTHS[Number(month) - 1]}-${year}`;
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  /**
   * Counts the total number of child items (dietPlans) across all cyclePlans
   */
  getChildItemCount(dietPlan: IMemberDietPlan): number {
    if (!dietPlan.cyclePlans || dietPlan.cyclePlans.length === 0) {
      return 0;
    }
    return dietPlan.cyclePlans.reduce((total, cyclePlan: ICyclePlan) => {
      const dietPlansCount = cyclePlan.dietPlans?.length || 0;
      return total + dietPlansCount;
    }, 0);
  }

  /**
   * Checks if the child list is small (3 or fewer items)
   * Returns true if the list should be auto-expanded without showing expand button
   */
  isChildListSmall(dietPlan: IMemberDietPlan): boolean {
    const childCount = this.getChildItemCount(dietPlan);
    return childCount > 0 && childCount <= 3;
  }
}

