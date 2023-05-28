import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberAssessmentModel } from '../../../models/member.model';
import { ValidationUtil } from '../../../utilites/validation-util';
import { DropdownItem } from '../../../interfaces/dropdown-item';

@Component({
  selector: 'app-assessment-manage',
  templateUrl: './assessment-manage.component.html',
  styleUrls: ['./assessment-manage.component.scss'],
})
export class AssessmentManageComponent implements OnInit, AfterViewInit, OnDestroy {
  memberAssessmentObj: MemberAssessmentModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  genderList: DropdownItem[] = [];
  maritalStatusList: DropdownItem[] = [];
  religionList: DropdownItem[] = [];
  lifestyleList: DropdownItem[] = [];
  eatingHabitList: DropdownItem[] = [];
  typeOfExerciseList: DropdownItem[] = [];
  sleepingPatternList: DropdownItem[] = [];
  bloodSugarList: DropdownItem[] = [];
  urineOutputList: DropdownItem[] = [];
  formGroup: FormGroup = this.fb.group({
    dateOfBirth: [null, [Validators.required]],
    age: [null, [Validators.maxLength(6)]],
    genderId: [null, [Validators.required]],
    maritalStatusId: [null, [Validators.required]],
    religionId: [null, [Validators.required]],
    lifestyleId: [null, [Validators.required]],
    eatingHabitId: [null, [Validators.required]],
    tobaccoAmount: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    tobaccoFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    paan: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    smokingAmount: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    smokingFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    alcoholDrink: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    alcoholFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    alcoholAmount: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    aeratedDrinks: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    waterIntake: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    religious: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    fasting: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    restaurantVisit: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    preferredCuisine: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    whoCooks: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    hungerPeak: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    foodDislikes: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    otherFoodPreferences: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    doYouExercise: [null, [Validators.required]],
    typeOfExerciseId: [null, []],
    frequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    duration: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    time: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    allergies: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    allergySpecify: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    sleepingPatternId: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    sleepDuration: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    gas: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    hyperAcidity: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    constipation: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    periods: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    lmp: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    daysCycle: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    hairFall: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    kneePain: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    backPain: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    bloodSugarId: [null, []],
    bloodSugarValue: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    cholesterol: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    triglycerides: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    hdlCholesterol: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    ldlCholesterol: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    vldlCholesterol: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    hgLevel: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    urineOutputId: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    supplementMedicine: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    wakeupTiming: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    bfMenu: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    bfTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    mmMenu: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    mmTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    lunchMenu: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    lunchTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    eveMenu: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    eveTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    midEveMenu: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    midEveTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    dinnerMenu: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    dinnerTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    nightSnacks: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    bedTime: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    fruitsFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    breakFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    breadAmount: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    sweetFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    sweetAmount: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    teaFrequency: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    teaAmount: [null, [Validators.maxLength(InputLength.CHAR_100)]],
    remark: [null, [Validators.maxLength(InputLength.CHAR_2000)]],
    nutritionistSummery: [null, [Validators.maxLength(InputLength.CHAR_2000)]],
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  async bindData(): Promise<void> {
    if (this.memberAssessmentObj) {
      this.formGroup.patchValue({
        dateOfBirth: this.memberAssessmentObj.dateOfBirth ? this.memberAssessmentObj.dateOfBirth : null,
        age: this.memberAssessmentObj.age ? this.memberAssessmentObj.age : null,
        genderId: this.memberAssessmentObj.genderId ? this.memberAssessmentObj.genderId : null,
        maritalStatusId: this.memberAssessmentObj.maritalStatusId ? this.memberAssessmentObj.maritalStatusId : null,
        religionId: this.memberAssessmentObj.religionId ? this.memberAssessmentObj.religionId : null,
        lifestyleId: this.memberAssessmentObj.lifestyleId ? this.memberAssessmentObj.lifestyleId : null,
        eatingHabitId: this.memberAssessmentObj.eatingHabitId ? this.memberAssessmentObj.eatingHabitId : null,
        tobaccoAmount: this.memberAssessmentObj.tobaccoAmount ? this.memberAssessmentObj.tobaccoAmount : null,
        tobaccoFrequency: this.memberAssessmentObj.tobaccoFrequency ? this.memberAssessmentObj.tobaccoFrequency : null,
        paan: this.memberAssessmentObj.paan ? this.memberAssessmentObj.paan : null,
        smokingAmount: this.memberAssessmentObj.smokingAmount ? this.memberAssessmentObj.smokingAmount : null,
        smokingFrequency: this.memberAssessmentObj.smokingFrequency ? this.memberAssessmentObj.smokingFrequency : null,
        alcoholDrink: this.memberAssessmentObj.alcoholDrink ? this.memberAssessmentObj.alcoholDrink : null,
        alcoholFrequency: this.memberAssessmentObj.alcoholFrequency ? this.memberAssessmentObj.alcoholFrequency : null,
        alcoholAmount: this.memberAssessmentObj.alcoholAmount ? this.memberAssessmentObj.alcoholAmount : null,
        aeratedDrinks: this.memberAssessmentObj.aeratedDrinks ? this.memberAssessmentObj.aeratedDrinks : null,
        waterIntake: this.memberAssessmentObj.waterIntake ? this.memberAssessmentObj.waterIntake : null,
        religious: this.memberAssessmentObj.religious ? this.memberAssessmentObj.religious : null,
        fasting: this.memberAssessmentObj.fasting ? this.memberAssessmentObj.fasting : null,
        restaurantVisit: this.memberAssessmentObj.restaurantVisit ? this.memberAssessmentObj.restaurantVisit : null,
        preferredCuisine: this.memberAssessmentObj.preferredCuisine ? this.memberAssessmentObj.preferredCuisine : null,
        whoCooks: this.memberAssessmentObj.whoCooks ? this.memberAssessmentObj.whoCooks : null,
        hungerPeak: this.memberAssessmentObj.hungerPeak ? this.memberAssessmentObj.hungerPeak : null,
        foodDislikes: this.memberAssessmentObj.foodDislikes ? this.memberAssessmentObj.foodDislikes : null,
        otherFoodPreferences: this.memberAssessmentObj.otherFoodPreferences ? this.memberAssessmentObj.otherFoodPreferences : null,
        doYouExercise: this.memberAssessmentObj.doYouExercise ? this.memberAssessmentObj.doYouExercise : null,
        typeOfExerciseId: this.memberAssessmentObj.typeOfExerciseId ? this.memberAssessmentObj.typeOfExerciseId : null,
        frequency: this.memberAssessmentObj.frequency ? this.memberAssessmentObj.frequency : null,
        duration: this.memberAssessmentObj.duration ? this.memberAssessmentObj.duration : null,
        time: this.memberAssessmentObj.time ? this.memberAssessmentObj.time : null,
        allergies: this.memberAssessmentObj.allergies ? this.memberAssessmentObj.allergies : null,
        allergySpecify: this.memberAssessmentObj.allergySpecify ? this.memberAssessmentObj.allergySpecify : null,
        sleepingPatternId: this.memberAssessmentObj.sleepingPatternId ? this.memberAssessmentObj.sleepingPatternId : null,
        sleepDuration: this.memberAssessmentObj.sleepDuration ? this.memberAssessmentObj.sleepDuration : null,
        gas: this.memberAssessmentObj.gas ? this.memberAssessmentObj.gas : null,
        hyperAcidity: this.memberAssessmentObj.hyperAcidity ? this.memberAssessmentObj.hyperAcidity : null,
        constipation: this.memberAssessmentObj.constipation ? this.memberAssessmentObj.constipation : null,
        periods: this.memberAssessmentObj.periods ? this.memberAssessmentObj.periods : null,
        lmp: this.memberAssessmentObj.lmp ? this.memberAssessmentObj.lmp : null,
        daysCycle: this.memberAssessmentObj.daysCycle ? this.memberAssessmentObj.daysCycle : null,
        hairFall: this.memberAssessmentObj.hairFall ? this.memberAssessmentObj.hairFall : null,
        kneePain: this.memberAssessmentObj.kneePain ? this.memberAssessmentObj.kneePain : null,
        backPain: this.memberAssessmentObj.backPain ? this.memberAssessmentObj.backPain : null,
        bloodSugarId: this.memberAssessmentObj.bloodSugarId ? this.memberAssessmentObj.bloodSugarId : null,
        bloodSugarValue: this.memberAssessmentObj.bloodSugarValue ? this.memberAssessmentObj.bloodSugarValue : null,
        cholesterol: this.memberAssessmentObj.cholesterol ? this.memberAssessmentObj.cholesterol : null,
        triglycerides: this.memberAssessmentObj.triglycerides ? this.memberAssessmentObj.triglycerides : null,
        hdlCholesterol: this.memberAssessmentObj.hdlCholesterol ? this.memberAssessmentObj.hdlCholesterol : null,
        ldlCholesterol: this.memberAssessmentObj.ldlCholesterol ? this.memberAssessmentObj.ldlCholesterol : null,
        vldlCholesterol: this.memberAssessmentObj.vldlCholesterol ? this.memberAssessmentObj.vldlCholesterol : null,
        hgLevel: this.memberAssessmentObj.hgLevel ? this.memberAssessmentObj.hgLevel : null,
        urineOutputId: this.memberAssessmentObj.urineOutputId ? this.memberAssessmentObj.urineOutputId : null,
        supplementMedicine: this.memberAssessmentObj.supplementMedicine ? this.memberAssessmentObj.supplementMedicine : null,
        wakeupTiming: this.memberAssessmentObj.wakeupTiming ? this.memberAssessmentObj.wakeupTiming : null,
        bfMenu: this.memberAssessmentObj.bfMenu ? this.memberAssessmentObj.bfMenu : null,
        bfTime: this.memberAssessmentObj.bfTime ? this.memberAssessmentObj.bfTime : null,
        mmMenu: this.memberAssessmentObj.mmMenu ? this.memberAssessmentObj.mmMenu : null,
        mmTime: this.memberAssessmentObj.mmTime ? this.memberAssessmentObj.mmTime : null,
        lunchMenu: this.memberAssessmentObj.lunchMenu ? this.memberAssessmentObj.lunchMenu : null,
        lunchTime: this.memberAssessmentObj.lunchTime ? this.memberAssessmentObj.lunchTime : null,
        eveMenu: this.memberAssessmentObj.eveMenu ? this.memberAssessmentObj.eveMenu : null,
        eveTime: this.memberAssessmentObj.eveTime ? this.memberAssessmentObj.eveTime : null,
        midEveMenu: this.memberAssessmentObj.midEveMenu ? this.memberAssessmentObj.midEveMenu : null,
        midEveTime: this.memberAssessmentObj.midEveTime ? this.memberAssessmentObj.midEveTime : null,
        dinnerMenu: this.memberAssessmentObj.dinnerMenu ? this.memberAssessmentObj.dinnerMenu : null,
        dinnerTime: this.memberAssessmentObj.dinnerTime ? this.memberAssessmentObj.dinnerTime : null,
        nightSnacks: this.memberAssessmentObj.nightSnacks ? this.memberAssessmentObj.nightSnacks : null,
        bedTime: this.memberAssessmentObj.bedTime ? this.memberAssessmentObj.bedTime : null,
        fruitsFrequency: this.memberAssessmentObj.fruitsFrequency ? this.memberAssessmentObj.fruitsFrequency : null,
        breakFrequency: this.memberAssessmentObj.breakFrequency ? this.memberAssessmentObj.breakFrequency : null,
        breadAmount: this.memberAssessmentObj.breadAmount ? this.memberAssessmentObj.breadAmount : null,
        sweetFrequency: this.memberAssessmentObj.sweetFrequency ? this.memberAssessmentObj.sweetFrequency : null,
        sweetAmount: this.memberAssessmentObj.sweetAmount ? this.memberAssessmentObj.sweetAmount : null,
        teaFrequency: this.memberAssessmentObj.teaFrequency ? this.memberAssessmentObj.teaFrequency : null,
        teaAmount: this.memberAssessmentObj.teaAmount ? this.memberAssessmentObj.teaAmount : null,
        remark: this.memberAssessmentObj.remark ? this.memberAssessmentObj.remark : null,
        nutritionistSummery: this.memberAssessmentObj.nutritionistSummery ? this.memberAssessmentObj.nutritionistSummery : null,
      });
    }
  }

  async loadMasterData(): Promise<void> {
    this.genderList = [];
    this.maritalStatusList = [];
    this.religionList = [];
    this.lifestyleList = [];
    this.eatingHabitList = [];
    this.typeOfExerciseList = [];
    this.sleepingPatternList = [];
    this.bloodSugarList = [];
    this.urineOutputList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_ASSESSMENT_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.gender) {
            this.genderList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.maritalStatus) {
            this.maritalStatusList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.religion) {
            this.religionList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.lifestyle) {
            this.lifestyleList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.eatingHabit) {
            this.eatingHabitList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.typeOfExercise) {
            this.typeOfExerciseList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.sleepingPattern) {
            this.sleepingPatternList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.bloodSugar) {
            this.bloodSugarList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.urineOutput) {
            this.urineOutputList.push(DropdownItem.fromJson(s));
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

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_ASSESSMENT_MANAGEMENT, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data) {
            this.memberAssessmentObj = MemberAssessmentModel.fromJson(res.data);
          } else {
            this.memberAssessmentObj = new MemberAssessmentModel();
          }
          await this.bindData();
          break;
        case ServerResponseEnum.WARNING:
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  onCancel(): void {
    this.navigationService.back();
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_ASSESSMENT_MANAGEMENT, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_ASSESSMENT_MANAGEMENT, payload, true);
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.onCancel();
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
