import { Component, Inject, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { filter, map } from 'lodash';
import { IResponse, ITableList, IMemberHealthIssue } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-health-issue-selection-dialog',
  templateUrl: './health-issue-selection-dialog.component.html',
  styleUrls: ['./health-issue-selection-dialog.component.scss']
})
export class HealthIssueSelectionDialogComponent implements OnInit {
  memberId: number;
  stringRes = StringResources;
  memberHealthIssues: IMemberHealthIssue[] = [];
  displayedColumns = ['seqNo', 'title', 'selected'];

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    public dialogRef: MatDialogRef<HealthIssueSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: number) {
    this.memberId = this.data;
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataById(this.memberId);
  }

  onNegativeClick(): void {
    this.closeDialog(false);
  }

  onPositiveClick(): void {
    this.closeDialog(true);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  async loadDataById(id: number): Promise<void> {
    this.memberHealthIssues = [];
    const res = await this.httpService.getRequest<IResponse<ITableList<IMemberHealthIssue>>>(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, id, null, true);
    if (res) {
      this.memberHealthIssues = res.data.data;
    }
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberHealthIssues, { isSelected: true }), 'id');
    let payload: any = {
      healthIssueIds: ids
    };
    if (this.memberId > 0) {
      await this.httpService.putRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, this.memberId, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
