import { Component, Inject, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { StringResources } from '../../../enum/string-resources';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberPocketGuideModel } from '../../../models/member-pocket-guide.model';
import { filter, map } from 'lodash';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-member-pocket-guide-manage-dialog',
  templateUrl: './member-pocket-guide-manage-dialog.component.html',
  styleUrls: ['./member-pocket-guide-manage-dialog.component.scss'],
})
export class MemberPocketGuideManageDialogComponent implements OnInit {
  id: number;
  stringRes = StringResources;
  memberPocketGuides: MemberPocketGuideModel[] = [];
  displayedColumns = ['seqNo', 'title', 'selected'];

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    public dialogRef: MatDialogRef<MemberPocketGuideManageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.id = data.memberId;
  }

  async ngOnInit(): Promise<void> {
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  async loadDataById(id: number): Promise<void> {
    this.memberPocketGuides = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data.list) {
            for (const s of res.data.list) {
              this.memberPocketGuides.push(MemberPocketGuideModel.fromJson(s));
            }
          }
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showError('No pocket guide available');
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
    const ids = map(filter(this.memberPocketGuides, { isSelected: true }), 'id');
    let payload: any = {
      pocketGuideIds: ids,
    };
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, payload, true);
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
