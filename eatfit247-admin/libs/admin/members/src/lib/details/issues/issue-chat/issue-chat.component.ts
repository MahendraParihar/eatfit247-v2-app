import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent } from '@shared';
import { IManageMemberIssueResponse, IMemberIssue, IMemberIssueResponse, InputLengthEnum } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { Subject } from 'rxjs';

export interface IssueChatData {
  memberId: number;
  issue: IMemberIssue;
}

@Component({
  selector: 'lib-issue-chat',
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
    MatSnackBarModule,
    InputErrorComponent
  ],
  templateUrl: './issue-chat.component.html',
  styleUrl: './issue-chat.component.scss'
})
export class IssueChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  dialogRef = inject<MatDialogRef<IssueChatComponent>>(MatDialogRef);
  data = inject<IssueChatData>(MAT_DIALOG_DATA);
  private apiService = inject(MembersApiService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  @ViewChild('chatMessages', { static: false }) chatMessagesElement!: ElementRef<HTMLDivElement>;
  
  issue!: IMemberIssue;
  responses: IMemberIssueResponse[] = [];
  loading = false;
  sendingResponse = false;
  formGroup!: FormGroup;
  InputLengthEnum = InputLengthEnum;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor() {
    const data = this.data;

    this.issue = data.issue;
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
      response: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_1000)]]
    });
  }

  async loadResponses(): Promise<void> {
    this.loading = true;
    try {
      this.responses = await this.apiService.getIssueResponses(this.data.memberId, this.issue.memberIssueId);
      this.shouldScrollToBottom = true;
    } catch (error) {
      this.snackBar.open('Failed to load responses. Please try again.', 'Close', {
        duration: 5000,
      });
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
          this.data.memberId,
          this.issue.memberIssueId,
          <IManageMemberIssueResponse>{
            response: this.formGroup.value.response,
            memberIssueId: this.issue.memberIssueId,
          },
        );
        this.formGroup.reset();
        this.snackBar.open('Response sent successfully', 'Close', {
          duration: 3000,
        });
        await this.loadResponses(); // Reload responses - will trigger scroll
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
      const updatedIssue = await this.apiService.markIssueAsSolved(
        this.data.memberId,
        this.issue.memberIssueId,
        isSolved
      );
      this.issue = updatedIssue;
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
      this.issue.issueStatus?.toLowerCase().includes(status)
    );
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  onClose(): void {
    this.dialogRef.close(true);
  }
}
