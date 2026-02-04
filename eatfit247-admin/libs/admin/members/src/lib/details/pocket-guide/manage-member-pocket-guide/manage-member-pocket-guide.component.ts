import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MembersApiService } from '../../../api.service';
import { IMemberPocketGuide } from '@eatfit247-shared-lib';

export interface ManageMemberPocketGuideData {
  memberId: number;
}

@Component({
  selector: 'lib-manage-member-pocket-guide',
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
  templateUrl: './manage-member-pocket-guide.component.html',
  styleUrl: './manage-member-pocket-guide.component.scss',
})
export class ManageMemberPocketGuideComponent implements OnInit {
  pocketGuides: IMemberPocketGuide[] = [];
  dataSource = new MatTableDataSource<IMemberPocketGuide>([]);
  loading = false;
  displayedColumns: string[] = ['select', 'pocketGuide'];

  constructor(
    public dialogRef: MatDialogRef<ManageMemberPocketGuideComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberPocketGuideData,
    private apiService: MembersApiService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadPocketGuides();
  }

  async loadPocketGuides(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.getPocketGuideList(this.data.memberId);
      this.pocketGuides = res.tableData;
      this.dataSource.data = this.pocketGuides;
    } catch (error) {
      this.snackBar.open('Failed to load pocket guides. Please try again.', 'Close', {
        duration: 5000,
      });
      this.pocketGuides = [];
      this.dataSource.data = [];
    } finally {
      this.loading = false;
    }
  }

  toggleSelection(pocketGuide: IMemberPocketGuide): void {
    pocketGuide.isSelected = !pocketGuide.isSelected;
  }

  isAllSelected(): boolean {
    return (
      this.pocketGuides.length > 0 &&
      this.pocketGuides.every((pg) => pg.isSelected)
    );
  }

  isIndeterminate(): boolean {
    const selectedCount = this.pocketGuides.filter(
      (pg) => pg.isSelected,
    ).length;
    return selectedCount > 0 && selectedCount < this.pocketGuides.length;
  }

  toggleAllSelection(): void {
    const allSelected = this.isAllSelected();
    this.pocketGuides.forEach((pg) => (pg.isSelected = !allSelected));
  }

  async onUpdate(): Promise<void> {
    const selectedIds = this.pocketGuides
      .filter((pg) => pg.isSelected)
      .map((pg) => pg.pocketGuideId);
    this.loading = true;
    try {
      await this.apiService.managePocketGuides(this.data.memberId, selectedIds);
      this.snackBar.open('Pocket guides updated successfully', 'Close', {
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
