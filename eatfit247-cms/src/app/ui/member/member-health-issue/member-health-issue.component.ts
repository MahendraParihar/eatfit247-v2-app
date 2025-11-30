import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { ActivatedRoute } from '@angular/router';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import {
  MemberHealthIssueManageDialogComponent
} from '../member-health-issue-manage-dialog/member-health-issue-manage-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { IResponse, ITableList } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-health-issue',
  templateUrl: './member-health-issue.component.html',
  styleUrls: ['./member-health-issue.component.scss']
})
export class MemberHealthIssueComponent implements OnInit, AfterViewInit, OnDestroy {
  id: number;
  stringRes = StringResources;
  memberHealthIssues: any[] = [];
  displayedColumns = ['seqNo', 'title', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

  constructor(private httpService: HttpService,
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
      memberId: this.id
    };
    const dialogRef = this.dialog.open(MemberHealthIssueManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDataById();
      }
    });
  }

  async loadDataById(): Promise<void> {
    this.memberHealthIssues = [];
    const res = await this.httpService.getRequest<IResponse<ITableList<any>>>(ApiUrlEnum.MEMBER_HEALTH_ISSUE_LIST, this.id, null, true);
    if (res) {
      this.memberHealthIssues = res.data.data;
    }
  }
}
