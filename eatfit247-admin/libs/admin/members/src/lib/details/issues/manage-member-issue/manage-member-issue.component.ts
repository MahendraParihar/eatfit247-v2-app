import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent } from '@shared';
import { IDropdownItem, IManageMemberIssue, InputLengthEnum } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface ManageMemberIssueData {
  memberId: number;
  issue?: IManageMemberIssue;
}

@Component({
  selector: 'lib-manage-member-issue',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InputErrorComponent
  ],
  templateUrl: './manage-member-issue.component.html',
  styleUrl: './manage-member-issue.component.scss'
})
export class ManageMemberIssueComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ManageMemberIssueComponent>>(MatDialogRef);
  data = inject<ManageMemberIssueData>(MAT_DIALOG_DATA);
  private apiService = inject(MembersApiService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  formGroup!: FormGroup;
  loading = false;
  isEditMode = false;
  issueCategoryOptions: IDropdownItem[] = [];
  issueStatusOptions: IDropdownItem[] = [];
  InputLengthEnum = InputLengthEnum;

  constructor() {
    const data = this.data;

    this.initializeForm();
    this.isEditMode = !!data.issue;
  }

  ngOnInit(): void {
    this.loadMasterData();
    if (this.isEditMode && this.data.issue) {
      this.loadData();
    }
  }

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      issue: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_1000)]],
      issueCategoryId: [null, [Validators.required]],
      issueStatusId: [null, [Validators.required]]
    });
  }

  async loadMasterData(): Promise<void> {
    try {
      const res = await this.apiService.getIssuesMasterData();
      this.issueCategoryOptions = res.categories;
      this.issueStatusOptions = res.status;
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  private loadData(): void {
    if (this.data.issue) {
      this.formGroup.patchValue({
        issue: this.data.issue.issue || '',
        issueCategoryId: this.data.issue.issueCategoryId || null,
        issueStatusId: this.data.issue.issueStatusId || null
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.valid) {
      this.loading = true;
      try {
        const formValue: IManageMemberIssue = {
          memberId: this.data.memberId,
          issue: this.formGroup.value.issue,
          issueCategoryId: this.formGroup.value.issueCategoryId,
          issueStatusId: this.formGroup.value.issueStatusId
        };
        if (this.isEditMode && this.data.issue?.memberIssueId) {
          await this.apiService.updateIssue(
            this.data.memberId,
            this.data.issue.memberIssueId,
            formValue
          );
        } else {
          await this.apiService.createIssue(this.data.memberId, formValue);
        }
        this.snackBar.open(
          this.isEditMode ? 'Issue updated successfully' : 'Issue created successfully',
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      } finally {
        this.loading = false;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
