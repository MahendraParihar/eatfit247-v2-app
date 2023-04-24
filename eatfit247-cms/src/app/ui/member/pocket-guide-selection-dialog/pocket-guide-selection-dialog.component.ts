import {Component, Inject, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {MemberHealthIssueModel} from "../../../models/member-health-issue.model";
import {filter, map} from "lodash";
import {MemberPocketGuideModel} from "../../../models/member-pocket-guide.model";

@Component({
  selector: 'app-pocket-guide-selection-dialog',
  templateUrl: './pocket-guide-selection-dialog.component.html',
  styleUrls: ['./pocket-guide-selection-dialog.component.scss']
})
export class PocketGuideSelectionDialogComponent implements OnInit {

  memberId: number;
  stringRes = StringResources;
  memberPocketGuides: MemberPocketGuideModel[] = [];
  displayedColumns = ["seqNo", 'title', 'selected'];

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    public dialogRef: MatDialogRef<PocketGuideSelectionDialogComponent>,
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
    this.memberPocketGuides = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data.list) {
            for (const s of res.data.list) {
              this.memberPocketGuides.push(MemberHealthIssueModel.fromJson(s));
            }
          }
          break;
        case ServerResponseEnum.WARNING:
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberPocketGuides, {isSelected: true}), 'id');
    let payload: any = {
      pocketGuideIds: ids
    };
    let res: ResponseDataModel;
    if (this.memberId > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, this.memberId, payload, true)
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, payload, true)
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.onPositiveClick();
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
