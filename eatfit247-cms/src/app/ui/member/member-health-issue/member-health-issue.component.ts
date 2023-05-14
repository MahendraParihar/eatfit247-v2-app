import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { filter, map } from 'lodash';
import { MemberHealthIssueModel } from '../../../models/member-health-issue.model';
import {
  MemberHealthIssueManageDialogComponent,
} from '../member-health-issue-manage-dialog/member-health-issue-manage-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-member-health-issue',
  templateUrl: './member-health-issue.component.html',
  styleUrls: ['./member-health-issue.component.scss'],
})
export class MemberHealthIssueComponent implements OnInit, AfterViewInit, OnDestroy {

  id: number;
  stringRes = StringResources;
  memberHealthIssues: MemberHealthIssueModel[] = [];
  displayedColumns = ['seqNo', 'title', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private navigationService: NavigationService,
              private activatedRoute: ActivatedRoute,
              public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.id) {
      await this.loadDataById();
    }
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  onAddClick() {
    const dialogData = {
      memberId: this.id,
    };
    const dialogRef = this.dialog.open(MemberHealthIssueManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.loadDataById();
      }
    });
  }

  async loadDataById(): Promise<void> {
    this.memberHealthIssues = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_HEALTH_ISSUE_LIST, this.id, null, true);
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
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }
}
