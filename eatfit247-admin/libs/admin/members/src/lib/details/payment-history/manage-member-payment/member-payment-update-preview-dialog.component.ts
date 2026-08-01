import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IMemberPaymentUpdatePreview } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-member-payment-update-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './member-payment-update-preview-dialog.component.html',
  styleUrl: './member-payment-update-preview-dialog.component.scss',
})
export class MemberPaymentUpdatePreviewDialogComponent {
  dialogRef = inject<MatDialogRef<MemberPaymentUpdatePreviewDialogComponent>>(MatDialogRef);
  data = inject<IMemberPaymentUpdatePreview>(MAT_DIALOG_DATA);

  get changedItems() {
    return this.data.changes.filter((change) => change.changed);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
