import { Component, Inject, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { StringResources } from '../../../enum/string-resources';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { filter, map } from 'lodash';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IMemberPocketGuide, IResponse, ITableList } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-pocket-guide-manage-dialog',
  templateUrl: './member-pocket-guide-manage-dialog.component.html',
  styleUrls: ['./member-pocket-guide-manage-dialog.component.scss']
})
export class MemberPocketGuideManageDialogComponent implements OnInit {
  id: number;
  stringRes = StringResources;
  memberPocketGuides: IMemberPocketGuide[] = [];
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
    const res = await this.httpService.getRequest<IResponse<ITableList<IMemberPocketGuide>>>(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, id, null, true);
    this.memberPocketGuides = res.data.data;
  }

  onCancel(flag: boolean): void {
    this.dialogRef.close(flag);
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberPocketGuides, { isSelected: true }), 'id');
    let payload: any = {
      pocketGuideIds: ids
    };
    if (this.id > 0) {
      await this.httpService.putRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
