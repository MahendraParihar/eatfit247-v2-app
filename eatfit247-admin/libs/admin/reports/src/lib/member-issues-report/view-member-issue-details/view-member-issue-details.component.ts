import { AfterViewChecked, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { InputErrorComponent } from '@shared';
import {
  IManageMemberIssueResponse,
  IMemberIssue,
  IMemberIssueReportItem,
  IMemberIssueResponse,
  InputLengthEnum
} from '@eatfit247-shared-lib';
import { Subject } from 'rxjs';
import { MemberIssuesReportApiService } from '../api.service';

export interface MemberIssueDetailsDialogData {
  memberIssue: IMemberIssueReportItem;
}

@Component({
  selector: 'lib-view-member-issue-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatSnackBarModule,
    MatTooltipModule,
    InputErrorComponent
  ],
  templateUrl: './view-member-issue-details.component.html',
  styleUrl: './view-member-issue-details.component.scss'
})
export class ViewMemberIssueDetailsComponent
  implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessages', { static: false })
  chatMessagesElement!: ElementRef<HTMLDivElement>;
  memberIssue!: IMemberIssue;
  responses: IMemberIssueResponse[] = [];
  loading = false;
  sendingResponse = false;
  formGroup!: FormGroup;
  InputLengthEnum = InputLengthEnum;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    public dialogRef: MatDialogRef<ViewMemberIssueDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MemberIssueDetailsDialogData,
    private apiService: MemberIssuesReportApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Convert IMemberIssueReportItem to IMemberIssue format
    this.memberIssue = {
      memberIssueId: data.memberIssue.memberIssueId,
      memberId: data.memberIssue.memberId,
      issue: data.memberIssue.issue,
      issueStatusId: data.memberIssue.issueStatusId,
      issueCategoryId: data.memberIssue.issueCategoryId,
      issueStatus: data.memberIssue.issueStatus,
      issueCategory: data.memberIssue.issueCategory,
      createdAt: data.memberIssue.createdAt,
      updatedAt: data.memberIssue.updatedAt,
      createdBy: data.memberIssue.createdByUser?.adminId || 0,
      modifiedBy: data.memberIssue.updatedByUser?.adminId || 0,
      createdByUser: data.memberIssue.createdByUser,
      updatedByUser: data.memberIssue.updatedByUser
    };
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadResponses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      response: [
        '',
        [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_1000)]
      ]
    });
  }

  async loadResponses(): Promise<void> {
    this.loading = true;
    try {
      this.responses = await this.apiService.getIssueResponses(
        this.memberIssue.memberId,
        this.memberIssue.memberIssueId
      );
      this.shouldScrollToBottom = true;
    } catch (error) {
      this.snackBar.open(
        'Failed to load responses. Please try again.',
        'Close',
        {
          duration: 5000
        }
      );
      this.responses = [];
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.chatMessagesElement) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.chatMessagesElement.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      // Ignore scroll errors
    }
  }

  async sendResponse(): Promise<void> {
    if (this.formGroup.valid) {
      this.sendingResponse = true;
      try {
        await this.apiService.createIssueResponse(
          this.memberIssue.memberId,
          this.memberIssue.memberIssueId,
          <IManageMemberIssueResponse>{
            response: this.formGroup.value.response,
            memberIssueId: this.memberIssue.memberIssueId
          }
        );
        this.formGroup.reset();
        this.snackBar.open('Response sent successfully', 'Close', {
          duration: 3000
        });
        await this.loadResponses(); // Reload responses - will trigger scroll
        // Reload issue to get updated status
        const updatedIssue = await this.apiService.getIssues(this.memberIssue.memberId);
        const currentIssue = updatedIssue.find((i: IMemberIssue) => i.memberIssueId === this.memberIssue.memberIssueId);
        if (currentIssue) {
          this.memberIssue = currentIssue;
        }
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      } finally {
        this.sendingResponse = false;
      }
    }
  }

  async markAsSolved(isSolved: boolean): Promise<void> {
    this.loading = true;
    try {
      this.memberIssue = await this.apiService.markIssueAsSolved(
        this.memberIssue.memberId,
        this.memberIssue.memberIssueId,
        isSolved
      );
      if (isSolved) {
        // Reload responses to show any system messages
        await this.loadResponses();
      }
      this.snackBar.open(
        isSolved ? 'Issue marked as solved' : 'Issue reopened',
        'Close',
        { duration: 3000 }
      );
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  isIssueClosed(): boolean {
    const closedStatuses = ['closed', 'resolved', 'solved'];
    return closedStatuses.some((status) =>
      this.memberIssue.issueStatus?.toLowerCase().includes(status)
    );
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  viewMember(): void {
    this.router.navigate([
      '/members/details',
      this.memberIssue.memberId,
      'dashboard'
    ]);
    this.dialogRef.close({ updated: true });
  }

  onClose(): void {
    this.dialogRef.close({ updated: false });
  }
}

