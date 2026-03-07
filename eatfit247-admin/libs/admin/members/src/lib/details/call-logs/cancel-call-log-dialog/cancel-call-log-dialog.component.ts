import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InputErrorComponent } from '@shared';

@Component({
  selector: 'lib-cancel-call-log-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    InputErrorComponent,
  ],
  templateUrl: './cancel-call-log-dialog.component.html',
  styleUrl: './cancel-call-log-dialog.component.scss',
})
export class CancelCallLogDialogComponent {
  dialogRef = inject<MatDialogRef<CancelCallLogDialogComponent>>(MatDialogRef);
  private fb = inject(FormBuilder);

  formGroup: FormGroup;

  constructor() {
    this.formGroup = this.fb.group({
      reason: ['', [Validators.required, Validators.maxLength(250)]],
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.formGroup.value.reason);
  }
}

