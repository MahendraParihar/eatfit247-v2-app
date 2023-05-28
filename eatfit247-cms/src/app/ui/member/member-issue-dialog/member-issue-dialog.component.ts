import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InputLength } from 'src/app/constants/input-length';
import { ApiUrlEnum } from 'src/app/enum/api-url-enum';
import { IssueStatusEnum } from 'src/app/enum/issue-status-enum';
import { ServerResponseEnum } from 'src/app/enum/server-response-enum';
import { StringResources } from 'src/app/enum/string-resources';
import { MemberIssueModel } from 'src/app/models/member-isssue.model';
import { ResponseDataModel } from 'src/app/models/response-data.model';
import { HttpService } from 'src/app/service/http.service';
import { SnackBarService } from 'src/app/service/snack-bar.service';
import { ValidationUtil } from 'src/app/utilites/validation-util';

@Component({
  selector: 'app-member-issue-dialog',
  templateUrl: './member-issue-dialog.component.html',
  styleUrls: ['./member-issue-dialog.component.scss'],
})
export class MemberIssueDialogComponent implements OnInit {
  stringRes = StringResources;
  memberIssueModel: MemberIssueModel;
  memberId: number;
  inputLength = InputLength;
  isReadOnly: boolean = false;
  formGroup: UntypedFormGroup = this.fb.group({
    issueResponse: [null, [Validators.required, Validators.maxLength(InputLength.CHAR_1000)]],
  });

  constructor(public dialogRef: MatDialogRef<MemberIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef) {
    this.memberId = data.memberId;
    this.memberIssueModel = data.memberIssueModel;
  }

  get formControl() {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
    if (this.memberIssueModel) {
      this.isReadOnly = this.memberIssueModel.issueStatusId == IssueStatusEnum.IN_PROGRESS ? false : true;
      this.formGroup.patchValue({
        issueResponse: this.memberIssueModel.response,
      });
      this.cdr.detectChanges();
    }
  }

  onClose(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  async saveResponse(): Promise<boolean> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return false;
    }
    let res: ResponseDataModel;
    const payload = {
      response: this.formGroup.value.issueResponse,
      memberIssueId: this.memberIssueModel.issueId,
      memberIssueResponseId: this.memberIssueModel.memberIssueResponseId,
    };
    res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_ISSUE_MANAGE, payload, true);
    if (!res) {
      return false;
    }
    switch (res.code) {
      case ServerResponseEnum.SUCCESS:
        this.snackBarService.showSuccess(res.message);
        this.closeDialog(true);
        return true;
      case ServerResponseEnum.WARNING:
        this.snackBarService.showWarning(res.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(res.message);
        return false;
    }
  }
}
