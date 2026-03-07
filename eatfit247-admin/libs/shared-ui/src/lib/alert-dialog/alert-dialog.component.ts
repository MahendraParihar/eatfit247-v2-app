import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AlertDialogData {
  title: string;
  message: string;
  positiveBtnTxt?: string;
  negativeBtnTxt?: string;
  alertType?: 'info' | 'warning' | 'error' | 'success';
}

@Component({
  selector: 'shared-ui-alert-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.scss',
})
export class AlertDialogComponent {
  dialogRef = inject<MatDialogRef<AlertDialogComponent>>(MatDialogRef);
  data = inject<AlertDialogData>(MAT_DIALOG_DATA);


  onPositiveClick(): void {
    this.dialogRef.close(true);
  }

  onNegativeClick(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.alertType) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check_circle';
      case 'info':
      default:
        return 'info';
    }
  }

  getColorClass(): string {
    switch (this.data.alertType) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warn';
      case 'success':
        return 'primary';
      case 'info':
      default:
        return 'primary';
    }
  }
}
