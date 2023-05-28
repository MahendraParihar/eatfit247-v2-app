import { Component, Inject, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { StringResources } from '../../../enum/string-resources';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { filter, map } from 'lodash';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberHealthIssueModel } from '../../../models/member-health-issue.model';

@Component({
  selector: 'app-member-pocket-guide-manage-dialog',
  templateUrl: './member-health-issue-manage-dialog.component.html',
  styleUrls: ['./member-health-issue-manage-dialog.component.scss'],
})
export class MemberHealthIssueManageDialogComponent implements OnInit {
  id: number;
  stringRes = StringResources;
  memberHealthIssues: MemberHealthIssueModel[] = [];
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
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data.list) {
            for (const s of res.data.list) {
              this.memberHealthIssues.push(MemberHealthIssueModel.fromJson(s));
            }
          }
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showError('No health issue available');
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  onCancel(flag: boolean): void {
    this.dialogRef.close(flag);
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberHealthIssues, { isSelected: true }), 'id');
    let payload: any = {
      healthIssueIds: ids,
    };
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_MANAGE, payload, true);
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.onCancel(true);
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }
}
