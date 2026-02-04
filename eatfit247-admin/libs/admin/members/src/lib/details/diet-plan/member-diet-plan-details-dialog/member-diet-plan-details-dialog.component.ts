import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { IMemberDietDetail } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface MemberDietPlanDetailsDialogData {
  memberId: number;
  dietPlanDetails: IMemberDietDetail;
}

@Component({
  selector: 'lib-member-diet-plan-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './member-diet-plan-details-dialog.component.html',
  styleUrl: './member-diet-plan-details-dialog.component.scss',
})
export class MemberDietPlanDetailsDialogComponent implements OnInit {
  dietPlanDetail!: IMemberDietDetail;
  displayColumns = ['category', 'detail', 'recipes'];
  memberId!: number;

  constructor(
    public dialogRef: MatDialogRef<MemberDietPlanDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MemberDietPlanDetailsDialogData,
    private apiService: MembersApiService,
    private snackBar: MatSnackBar
  ) {
    this.dietPlanDetail = data.dietPlanDetails;
    this.memberId = data.memberId;
  }

  ngOnInit(): void {
  }

  onClose(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  async downloadDietPlan(): Promise<void> {
    try {
      const planId = (this.dietPlanDetail as any).dietPlanId;
      if (!planId) return;
      
      let fileData;
      if (this.dietPlanDetail.dayNo) {
        fileData = await this.apiService.downloadDietPlanDay(
          this.memberId,
          planId,
          this.dietPlanDetail.cycleNo,
          this.dietPlanDetail.dayNo
        );
      } else {
        fileData = await this.apiService.downloadDietPlanCycle(
          this.memberId,
          planId,
          this.dietPlanDetail.cycleNo
        );
      }
      if (fileData) {
        this.downloadTemplate(fileData.buffer, fileData.fileName);
        this.snackBar.open('Diet plan downloaded successfully', 'Close', { duration: 3000 });
      }
    } catch (error) {
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

  async sendEmail(): Promise<void> {
    try {
      const planId = (this.dietPlanDetail as any).dietPlanId;
      if (!planId) return;
      
      if (this.dietPlanDetail.dayNo) {
        await this.apiService.sendDietPlanEmailDay(
          this.memberId,
          planId,
          this.dietPlanDetail.cycleNo,
          this.dietPlanDetail.dayNo
        );
      } else {
        await this.apiService.sendDietPlanEmailCycle(
          this.memberId,
          planId,
          this.dietPlanDetail.cycleNo
        );
      }
      this.snackBar.open('Email sent successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Failed to send email', 'Close', { duration: 3000 });
    }
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getDietPlanTitle(): string {
    if (this.dietPlanDetail.dayNo) {
      return `Diet Plan - Cycle ${this.dietPlanDetail.cycleNo}, Day ${this.dietPlanDetail.dayNo}`;
    }
    return `Diet Plan - Cycle ${this.dietPlanDetail.cycleNo}`;
  }
}

