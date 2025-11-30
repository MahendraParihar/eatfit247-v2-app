import { Component, Inject, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { filter, map } from 'lodash';
import { ITableList, IMemberPocketGuide } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-pocket-guide-selection-dialog',
  templateUrl: './pocket-guide-selection-dialog.component.html',
  styleUrls: ['./pocket-guide-selection-dialog.component.scss']
})
export class PocketGuideSelectionDialogComponent implements OnInit {
  memberId: number;
  stringRes = StringResources;
  memberPocketGuides: IMemberPocketGuide[] = [];
  displayedColumns = ['seqNo', 'title', 'selected'];

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
    const res: ITableList<IMemberPocketGuide> = await this.httpService.getRequest<ITableList<IMemberPocketGuide>>(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, id, null, true);
    if (res.data) {
      this.memberPocketGuides = res.data;
    }
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberPocketGuides, { isSelected: true }), 'id');
    let payload: any = {
      pocketGuideIds: ids
    };
    if (this.memberId > 0) {
      await this.httpService.putRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, this.memberId, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
