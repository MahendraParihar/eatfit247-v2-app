import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { CyclePlan, MemberDietDetail, MemberDietPlanModel } from '../../../models/member-diet-plan.model';
import { DietPlanStatusEnum } from '../../../enum/diet-plan-status-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import {
  MemberDietPlanDetailsDialogComponent,
} from '../member-diet-plan-details-dialog/member-diet-plan-details-dialog.component';
import { DropdownItem } from 'src/app/interfaces/dropdown-item';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationUtil } from 'src/app/utilites/validation-util';
import { MemberDietPlanDatasource } from '../member-diet-plan.datasource';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { DietTypeEnum } from '../../../enum/diet-type-enum';

@Component({
  selector: 'app-member-diet-plan-list',
  templateUrl: './member-diet-plan-list.component.html',
  styleUrls: ['./member-diet-plan-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MemberDietPlanListComponent implements OnInit, AfterViewInit, OnDestroy {
  totalCount = 0;
  list: MemberDietPlanModel[];
  columnsToDisplay: string[] = ['program', 'programCategory', 'noOfCycle', 'dietPlanStatus', 'updatedBy'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  id: number;
  dietPlanStatusEnum = DietPlanStatusEnum;
  dietTypeEnum = DietTypeEnum;
  dietTemplateList: DropdownItem[];
  expandArray: boolean[] = [];
  stringRes = StringResources;
  dataSource: MemberDietPlanDatasource;
  formGroup: FormGroup = this.formBuilder.group({
    dietTemplateId: [null, [Validators.required]],
  });

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public dialog: MatDialog) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
    this.dataSource = new MemberDietPlanDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
    this.dataSource.dietTemplate.subscribe((count: DropdownItem[]) => this.dietTemplateList = count);
    this.dataSource.expanded.subscribe((count: boolean[]) => this.expandArray = count);
    this.dataSource.data.subscribe((count: MemberDietPlanModel[]) => this.list = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
  }

  onAddClick(isDaily: boolean, dietPlan: MemberDietPlanModel) {
    if (isDaily) {
      this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN_DETAIL_DAY.toString()
        .replace(':id', this.id.toString())
        .replace(':dietId', dietPlan.id.toString())
        .replace(':cycleNo', dietPlan.upcomingCycle.toString())
        .replace(':dayNo', dietPlan.upcomingDay.toString()),
      );
    } else {
      this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN_DETAIL.toString()
        .replace(':id', this.id.toString())
        .replace(':dietId', dietPlan.id.toString())
        .replace(':cycleNo', dietPlan.upcomingCycle.toString()),
      );
    }
  }

  onEditDailyDietPlan(dietPlan: MemberDietDetail) {
    this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN_DETAIL_DAY.toString()
      .replace(':id', this.id.toString())
      .replace(':dietId', dietPlan.dietPlanId.toString())
      .replace(':cycleNo', dietPlan.cycleNo.toString())
      .replace(':dayNo', dietPlan.dayNo.toString()),
    );
  }

  onEditCycleDietPlan(dietPlanId: number, dietPlan: CyclePlan) {
    this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN_DETAIL.toString()
      .replace(':id', this.id.toString())
      .replace(':dietId', dietPlanId.toString())
      .replace(':cycleNo', dietPlan.cycleNo.toString()),
    );
  }

  async onDeleteDietPlan(dietPlan: MemberDietDetail) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.DELETE_DIET_PLAN_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '350px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.deleteDietPlanTask(dietPlan);
      }
    });
  }

  async deleteDietPlanTask(dietPlan: MemberDietDetail) {
    let apiUrl;
    if (dietPlan.dayNo){
      apiUrl = `${ApiUrlEnum.MEMBER_DIET_PLAN_DAY_DELETE}/${dietPlan.dietPlanId}/${dietPlan.cycleNo}/${dietPlan.dayNo}`;
    }else{
      apiUrl = `${ApiUrlEnum.MEMBER_DIET_PLAN_CYCLE_DELETE}/${dietPlan.dietPlanId}/${dietPlan.cycleNo}`
    }
    const res = await this.httpService.deleteRequest(apiUrl, null,true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.loadData();
          this.snackBarService.showSuccess(res.message);
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

  async loadData(): Promise<void> {
    await this.dataSource.loadData(ApiUrlEnum.MEMBER_DIET_PLAN, this.id);
  }

  onViewDietPlanClick(dietPlanDetails: MemberDietDetail) {
    const dialogRef = this.dialog.open(MemberDietPlanDetailsDialogComponent, {
      width: '550px',
      data: { id: this.id, dietPlanDetails: dietPlanDetails },
      closeOnNavigation: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
      }
    });
  }

  viewCycleDietPlan(cyclePlanItem: CyclePlan) {
    if (cyclePlanItem.type === 'CYCLE') {
      if (cyclePlanItem.dietPlans && cyclePlanItem.dietPlans.length > 0) {
        this.onViewDietPlanClick(cyclePlanItem.dietPlans[0]);
      }
    }
  }

  async onDietTemplateSubmit(model: MemberDietPlanModel) {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any =
      {
        dietTemplateId: this.formGroup.value.dietTemplateId,
        memberDietPlanId: model.id,
      };
    const res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_DIET_PLAN_TEMPLATE_UPDATE + '/' + this.id, payload, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.loadData();
          this.snackBarService.showSuccess(res.message);
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
