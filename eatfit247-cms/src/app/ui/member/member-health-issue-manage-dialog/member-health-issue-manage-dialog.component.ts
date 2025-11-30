import { Component, Inject, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { StringResources } from '../../../enum/string-resources';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { filter, map } from 'lodash';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IResponse, ITableList, IMemberHealthIssue } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-pocket-guide-manage-dialog',
  templateUrl: './member-health-issue-manage-dialog.component.html',
  styleUrls: ['./member-health-issue-manage-dialog.component.scss']
})
export class MemberHealthIssueManageDialogComponent implements OnInit {
  id: number;
  stringRes = StringResources;
  memberHealthIssues: IMemberHealthIssue[] = [];
  displayedColumns = ['seqNo', 'title', 'selected'];

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    public dialogRef: MatDialogRef<MemberHealthIssueManageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.id = data.memberId;
  }

  async ngOnInit(): Promise<void> {
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  async loadDataById(id: number): Promise<void> {
    this.memberHealthIssues = [];
    const res = await this.httpService.getRequest<IResponse<ITableList<IMemberHealthIssue>>>(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, id, null, true);
    this.memberHealthIssues = res.data.data;
  }

  onCancel(flag: boolean): void {
    this.dialogRef.close(flag);
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberHealthIssues, { isSelected: true }), 'id');
    let payload: any = {
      healthIssueIds: ids
    };
    if (this.id > 0) {
      await this.httpService.putRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
