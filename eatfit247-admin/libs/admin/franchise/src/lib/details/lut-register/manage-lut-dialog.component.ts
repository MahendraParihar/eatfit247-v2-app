import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IFranchiseLut, IManageFranchiseLut } from '@eatfit247-shared-lib';
import { FranchiseApiService } from '../../api.service';

export interface ManageLutDialogData {
  franchiseId: number;
  lut?: IFranchiseLut;
}

/** Current Indian FY label (April start), e.g. 2026-27. */
function currentFinancialYear(today = new Date()): string {
  const start = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

@Component({
  selector: 'lib-manage-lut-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './manage-lut-dialog.component.html',
  styleUrl: './manage-lut-dialog.component.scss',
})
export class ManageLutDialogComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(FranchiseApiService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ManageLutDialogComponent>);
  data = inject<ManageLutDialogData>(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = !!this.data.lut;

  form = this.fb.nonNullable.group({
    arn: [this.data.lut?.arn ?? '', [Validators.required, Validators.pattern(/^AD[0-9A-Za-z]{13}$/)]],
    financialYear: [
      this.data.lut?.financialYear ?? currentFinancialYear(),
      [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)],
    ],
    validFrom: [this.data.lut?.validFrom ?? '', Validators.required],
    validTo: [this.data.lut?.validTo ?? '', Validators.required],
  });

  /** Fills the full FY (1 April – 31 March), the usual validity of an LUT. */
  useWholeYear(): void {
    const fy = this.form.controls.financialYear.value;
    if (/^\d{4}-\d{2}$/.test(fy)) {
      const start = Number(fy.slice(0, 4));
      this.form.patchValue({ validFrom: `${start}-04-01`, validTo: `${start + 1}-03-31` });
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    const payload: IManageFranchiseLut = { ...value, arn: value.arn.trim().toUpperCase() };
    try {
      if (this.isEdit && this.data.lut) {
        await this.apiService.updateLut(this.data.franchiseId, this.data.lut.franchiseLutId, payload);
      } else {
        await this.apiService.createLut(this.data.franchiseId, payload);
      }
      this.snackBar.open(this.isEdit ? 'LUT updated' : 'LUT added', 'Close', { duration: 3000 });
      this.dialogRef.close(true);
    } catch {
      // Error toast (overlap, dates outside the FY, duplicate ARN) is shown by HttpErrorInterceptor
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
