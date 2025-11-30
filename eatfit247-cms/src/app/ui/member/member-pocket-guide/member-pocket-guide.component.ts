import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { ActivatedRoute } from '@angular/router';
import { StringResources } from '../../../enum/string-resources';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { MatDialog } from '@angular/material/dialog';
import {
  MemberPocketGuideManageDialogComponent
} from '../member-pocket-guide-manage-dialog/member-pocket-guide-manage-dialog.component';
import { IMemberPocketGuide, IResponse, ITableList } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-member-pocket-guide',
  templateUrl: './member-pocket-guide.component.html',
  styleUrls: ['./member-pocket-guide.component.scss']
})
export class MemberPocketGuideComponent implements OnInit, AfterViewInit, OnDestroy {
  id: number;
  totalCount = 0;
  stringRes = StringResources;
  memberPocketGuides: IMemberPocketGuide[] = [];
  displayedColumns = ['seqNo', 'title', 'file', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

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

  async loadDataById(): Promise<void> {
    this.memberPocketGuides = [];
    const res = await this.httpService.getRequest<IResponse<ITableList<IMemberPocketGuide>>>(ApiUrlEnum.MEMBER_POCKET_GUIDE_LIST, this.id, null, true);
    if (res) {
      this.totalCount = res.data.count;
      this.memberPocketGuides = res.data.data;
    }
  }

  onAddClick() {
    const dialogData = {
      memberId: this.id
    };
    const dialogRef = this.dialog.open(MemberPocketGuideManageDialogComponent, {
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
}
