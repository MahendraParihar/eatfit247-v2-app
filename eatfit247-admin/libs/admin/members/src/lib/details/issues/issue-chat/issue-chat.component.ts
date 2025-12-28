import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { InputErrorComponent } from '@shared';
import { IManageMemberIssueResponse, IMemberIssue, IMemberIssueResponse, InputLengthEnum } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { Subject, takeUntil } from 'rxjs';

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
    InputErrorComponent
  ],
  templateUrl: './issue-chat.component.html',
  styleUrl: './issue-chat.component.scss'
})
export class IssueChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessages', { static: false }) chatMessagesElement!: ElementRef<HTMLDivElement>;
  
  issue!: IMemberIssue;
  responses: IMemberIssueResponse[] = [];
  loading = false;
  sendingResponse = false;
  formGroup!: FormGroup;
  InputLengthEnum = InputLengthEnum;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    public dialogRef: MatDialogRef<IssueChatComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IssueChatData,
    private apiService: MembersApiService,
    private fb: FormBuilder
  ) {
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
      console.error('Error loading responses:', error);
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
        await this.loadResponses(); // Reload responses - will trigger scroll
      } catch (error) {
        console.error('Error sending response:', error);
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
    } catch (error) {
      console.error('Error marking issue as solved:', error);
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
