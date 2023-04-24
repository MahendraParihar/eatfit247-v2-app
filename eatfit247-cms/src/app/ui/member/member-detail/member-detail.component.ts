import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {MemberDetailModel} from "../../../models/member.model";
import {StringResources} from "../../../enum/string-resources";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {ActivatedRoute} from "@angular/router";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {NavigationPathEnum} from "../../../enum/navigation-path-enum";
import {AssessmentDetailDialogComponent} from "../assessment-detail-dialog/assessment-detail-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {
  HealthIssueSelectionDialogComponent
} from "../health-issue-selection-dialog/health-issue-selection-dialog.component";
import {
  PocketGuideSelectionDialogComponent
} from "../pocket-guide-selection-dialog/pocket-guide-selection-dialog.component";

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss']
})
export class MemberDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  memberObj: MemberDetailModel;
  id: number;
  stringRes = StringResources;
  activeTag = 0;

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private navigationService: NavigationService,
              private activatedRoute: ActivatedRoute,
              public dialog: MatDialog) {
    this.id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  async ngOnInit(): Promise<void> {
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  openAssessment(): void {
    const dialogRef = this.dialog.open(AssessmentDetailDialogComponent, {
      width: '650px',
      data: this.memberObj.assessmentObj,
    });
    dialogRef.afterClosed().subscribe();
  }

  openHealthIssueSelectionDialog() {
    const dialogRef = this.dialog.open(HealthIssueSelectionDialogComponent, {
      width: '650px',
      data: this.id,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.loadDataById(this.id);
      }
    });
  }

  openPocketGuideSelectionDialog() {
    const dialogRef = this.dialog.open(PocketGuideSelectionDialogComponent, {
      width: '650px',
      data: this.id,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.loadDataById(this.id);
      }
    });
  }

  navigateTo(index: number): void {
    switch (index) {
      case 0:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_HOME.toString().replace(':id', this.id.toString()));
        break
      case 1:
        this.navigationService.navigateByStrPath(NavigationPathEnum.ASSESSMENT_MANAGE.toString().replace(':id', this.id.toString()));
        break
      case 2:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_HEALTH_ISSUE.toString().replace(':id', this.id.toString()));
        break
      case 3:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_BODY_STATS.toString().replace(':id', this.id.toString()));
        break
      case 4:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN.toString().replace(':id', this.id.toString()));
        break
      case 5:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_CALL_SCHEDULE.toString().replace(':id', this.id.toString()));
        break
      case 6:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_POCKET_GUIDE.toString().replace(':id', this.id.toString()));
        break
      case 7:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_ISSUES.toString().replace(':id', this.id.toString()));
        break
      case 8:
        this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_PAYMENT_HISTORY.toString().replace(':id', this.id.toString()));
        break
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_DETAILS, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.memberObj = MemberDetailModel.fromJson(res.data);
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
