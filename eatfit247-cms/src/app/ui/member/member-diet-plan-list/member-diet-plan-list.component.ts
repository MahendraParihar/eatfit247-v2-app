import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {ActivatedRoute} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {NavigationPathEnum} from "../../../enum/navigation-path-enum";
import {CyclePlan, MemberDietDetail, MemberDietPlanModel} from "../../../models/member-diet-plan.model";
import {DietPlanStatusEnum} from "../../../enum/diet-plan-status-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {
  MemberDietPlanDetailsDialogComponent
} from '../member-diet-plan-details-dialog/member-diet-plan-details-dialog.component';
import {DropdownItem} from 'src/app/interfaces/dropdown-item';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ValidationUtil} from 'src/app/utilites/validation-util';

@Component({
  selector: 'app-member-diet-plan-list',
  templateUrl: './member-diet-plan-list.component.html',
  styleUrls: ['./member-diet-plan-list.component.scss']
})
export class MemberDietPlanListComponent implements OnInit, AfterViewInit, OnDestroy {

  totalCount = 0;
  list: MemberDietPlanModel[];
  id: number;
  dietPlanStatusEnum = DietPlanStatusEnum;
  dietTemplateList: DropdownItem[];

  stringRes = StringResources;
  dietPlanDayDisplayColumns = ['dayNo', 'startDate', 'action'];

  formGroup: FormGroup = this.formBuilder.group({
    dietTemplateId: [null, [Validators.required]]
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
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
  }

  onEditDailyDietPlan(dietPlan: MemberDietDetail) {
    this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN_DETAIL_DAY.toString()
      .replace(':id', this.id.toString())
      .replace(':dietId', dietPlan.dietPlanId.toString())
      .replace(':cycleNo', dietPlan.cycleNo.toString())
      .replace(':dayNo', dietPlan.dayNo.toString())
    );
  }

  onEditCycleDietPlan(dietPlanId: number, dietPlan: CyclePlan) {
    this.navigationService.navigateByStrPath(NavigationPathEnum.MEMBER_DIET_PLAN_DETAIL.toString()
      .replace(':id', this.id.toString())
      .replace(':dietId', dietPlanId.toString())
      .replace(':cycleNo', dietPlan.cycleNo.toString())
    );
  }


  async loadData(): Promise<boolean> {
    this.list = [];
    this.dietTemplateList = [];
    this.formGroup.reset();

    const apiResponse = await this.httpService.getRequest(ApiUrlEnum.MEMBER_DIET_PLAN, this.id, null, true);
    if (!apiResponse) {
      return false;
    }
    switch (apiResponse.code) {
      case ServerResponseEnum.SUCCESS:
        this.totalCount = apiResponse.data.count;
        for (let s of apiResponse.data.list) {
          this.list.push(MemberDietPlanModel.fromJson(s));
        }
        if (apiResponse.data.dietTemplateList) {
          this.dietTemplateList = [];
          for (const s of apiResponse.data.dietTemplateList) {
            this.dietTemplateList.push(DropdownItem.fromJson(s));
          }
        }
        return true;
      case ServerResponseEnum.WARNING:
        this.snackBarService.showWarning(apiResponse.message);
        return false;
      case ServerResponseEnum.ERROR:
      default:
        this.snackBarService.showError(apiResponse.message);
        return false;
    }
  }

  onViewDietPlanClick(dietPlanDetails: MemberDietDetail) {

    const dialogRef = this.dialog.open(MemberDietPlanDetailsDialogComponent, {
      width: '550px',
      data: {id: this.id, dietPlanDetails: dietPlanDetails},
      closeOnNavigation: false,
      disableClose: true
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
        memberDietPlanId: model.id
      };

    const res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_DIET_PLAN_TEMPLATE_UPDATE + '/' + this.id, payload, true)

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
