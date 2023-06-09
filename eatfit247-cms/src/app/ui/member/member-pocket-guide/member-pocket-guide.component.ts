import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { StringResources } from '../../../enum/string-resources';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberPocketGuideModel } from '../../../models/member-pocket-guide.model';
import { MatDialog } from '@angular/material/dialog';
import {
  MemberPocketGuideManageDialogComponent,
} from '../member-pocket-guide-manage-dialog/member-pocket-guide-manage-dialog.component';

@Component({
  selector: 'app-member-pocket-guide',
  templateUrl: './member-pocket-guide.component.html',
  styleUrls: ['./member-pocket-guide.component.scss'],
})
export class MemberPocketGuideComponent implements OnInit, AfterViewInit, OnDestroy {
  id: number;
  totalCount = 0;
  stringRes = StringResources;
  memberPocketGuides: MemberPocketGuideModel[] = [];
  displayedColumns = ['seqNo', 'title', 'file', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

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

  async loadDataById(): Promise<boolean> {
    this.memberPocketGuides = [];
    const apiResponse: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_LIST, this.id, null, true);
    if (!apiResponse) {
      return false;
    }
    if (apiResponse) {
      switch (apiResponse.code) {
        case ServerResponseEnum.SUCCESS:
          this.totalCount = apiResponse.data.count;
          for (let s of apiResponse.data.list) {
            this.memberPocketGuides.push(MemberPocketGuideModel.fromJson(s));
          }
          return true;
        case ServerResponseEnum.WARNING:
          return false;
        case ServerResponseEnum.ERROR:
        default:
          this.snackBarService.showError(apiResponse.message);
          return false;
      }
    }
    return false;
  }

  onAddClick() {
    const dialogData = {
      memberId: this.id,
    };
    const dialogRef = this.dialog.open(MemberPocketGuideManageDialogComponent, {
      width: '550px',
      data: dialogData,
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        this.loadDataById();
      }
    });
  }
}
