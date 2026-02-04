import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MembersApiService } from '../../../api.service';
import { IMemberHealthIssue } from '@eatfit247-shared-lib';

export interface ManageMemberHealthIssueData {
  memberId: number;
}

@Component({
  selector: 'lib-manage-member-health-issue',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './manage-member-health-issue.component.html',
  styleUrl: './manage-member-health-issue.component.scss',
})
export class ManageMemberHealthIssueComponent implements OnInit {
  healthIssues: IMemberHealthIssue[] = [];
  dataSource = new MatTableDataSource<IMemberHealthIssue>([]);
  loading = false;
  displayedColumns: string[] = ['select', 'healthIssue'];

  constructor(
    public dialogRef: MatDialogRef<ManageMemberHealthIssueComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberHealthIssueData,
    private apiService: MembersApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadHealthIssues();
  }

  async loadHealthIssues(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.getHealthIssueList(this.data.memberId);
      this.healthIssues = res.tableData;
      this.dataSource.data = this.healthIssues;
    } catch (error) {
      this.snackBar.open('Failed to load health issues. Please try again.', 'Close', {
        duration: 5000,
      });
      this.healthIssues = [];
      this.dataSource.data = [];
    } finally {
      this.loading = false;
    }
  }

  toggleSelection(healthIssue: IMemberHealthIssue): void {
    healthIssue.isSelected = !healthIssue.isSelected;
  }

  isAllSelected(): boolean {
    return (
      this.healthIssues.length > 0 &&
      this.healthIssues.every((hi) => hi.isSelected)
    );
  }

  isIndeterminate(): boolean {
    const selectedCount = this.healthIssues.filter(
      (hi) => hi.isSelected,
    ).length;
    return selectedCount > 0 && selectedCount < this.healthIssues.length;
  }

  toggleAllSelection(): void {
    const allSelected = this.isAllSelected();
    this.healthIssues.forEach((hi) => (hi.isSelected = !allSelected));
  }

  async onUpdate(): Promise<void> {
    const selectedIds = this.healthIssues
      .filter((hi) => hi.isSelected)
      .map((hi) => hi.healthIssueId);
    this.loading = true;
    try {
      await this.apiService.manageHealthIssues(this.data.memberId, selectedIds);
      this.snackBar.open('Health issues updated successfully', 'Close', {
        duration: 3000,
      });
      this.dialogRef.close(true);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
