import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, LoaderComponent } from '@shared';
import {
  CommonUtil,
  IDropdownItem,
  IManageMemberAssessment,
  IMemberAssessment,
  InputLengthEnum
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-assessment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    LoaderComponent,
    InputErrorComponent
  ],
  templateUrl: './member-assessment.component.html',
  styleUrl: './member-assessment.component.scss'
})
export class MemberAssessmentComponent implements OnInit, OnDestroy {
  memberId!: number;
  assessment: IMemberAssessment | null = null;
  loading = false;
  isEditMode = false;
  formGroup!: FormGroup;
  // Dropdown options
  genderOptions: IDropdownItem[] = [];
  maritalStatusOptions: IDropdownItem[] = [];
  religionOptions: IDropdownItem[] = [];
  lifestyleOptions: IDropdownItem[] = [];
  eatingHabitOptions: IDropdownItem[] = [];
  typeOfExerciseOptions: IDropdownItem[] = [];
  sleepingPatternOptions: IDropdownItem[] = [];
  bloodSugarOptions: IDropdownItem[] = [];
  urineOutputOptions: IDropdownItem[] = [];
  InputLengthEnum = InputLengthEnum;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: MembersApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  async ngOnInit(): Promise<void> {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadMasterData();
        this.loadAssessment();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      dateOfBirth: [null],
      age: [null, [Validators.maxLength(6)]],
      genderId: [null, [Validators.required]],
      maritalStatusId: [null, [Validators.required]],
      religionId: [null, [Validators.required]],
      lifestyleId: [null, [Validators.required]],
      eatingHabitId: [null, [Validators.required]],
      tobaccoAmount: [null, [Validators.maxLength(100)]],
      tobaccoFrequency: [null, [Validators.maxLength(100)]],
      paan: [null, [Validators.maxLength(100)]],
      smokingAmount: [null, [Validators.maxLength(100)]],
      smokingFrequency: [null, [Validators.maxLength(100)]],
      alcoholDrink: [null, [Validators.maxLength(100)]],
      alcoholFrequency: [null, [Validators.maxLength(100)]],
      alcoholAmount: [null, [Validators.maxLength(100)]],
      aeratedDrinks: [null, [Validators.maxLength(100)]],
      waterIntake: [null, [Validators.maxLength(100)]],
      religious: [null, [Validators.maxLength(100)]],
      fasting: [null, [Validators.maxLength(100)]],
      restaurantVisit: [null, [Validators.maxLength(100)]],
      preferredCuisine: [null, [Validators.maxLength(100)]],
      whoCooks: [null, [Validators.maxLength(100)]],
      hungerPeak: [null, [Validators.maxLength(100)]],
      foodDislikes: [null, [Validators.maxLength(100)]],
      otherFoodPreferences: [null, [Validators.maxLength(100)]],
      doYouExercise: [null, [Validators.required]],
      typeOfExerciseId: [null],
      frequency: [null, [Validators.maxLength(100)]],
      duration: [null, [Validators.maxLength(100)]],
      time: [null, [Validators.maxLength(100)]],
      allergies: [null, [Validators.maxLength(100)]],
      allergySpecify: [null, [Validators.maxLength(100)]],
      sleepingPatternId: [null, [Validators.required]],
      sleepDuration: [null, [Validators.maxLength(100)]],
      gas: [null, [Validators.maxLength(100)]],
      hyperAcidity: [null, [Validators.maxLength(100)]],
      constipation: [null, [Validators.maxLength(100)]],
      periods: [null, [Validators.maxLength(100)]],
      lmp: [null, [Validators.maxLength(100)]],
      daysCycle: [null, [Validators.maxLength(100)]],
      hairFall: [null, [Validators.maxLength(100)]],
      kneePain: [null, [Validators.maxLength(100)]],
      backPain: [null, [Validators.maxLength(100)]],
      bloodSugarId: [null],
      bloodSugarValue: [null, [Validators.maxLength(100)]],
      cholesterol: [null, [Validators.maxLength(100)]],
      triglycerides: [null, [Validators.maxLength(100)]],
      hdlCholesterol: [null, [Validators.maxLength(100)]],
      ldlCholesterol: [null, [Validators.maxLength(100)]],
      vldlCholesterol: [null, [Validators.maxLength(100)]],
      hgLevel: [null, [Validators.maxLength(100)]],
      urineOutputId: [null],
      supplementMedicine: [null, [Validators.maxLength(100)]],
      wakeupTiming: [null, [Validators.maxLength(100)]],
      bfMenu: [null, [Validators.maxLength(250)]],
      bfTime: [null, [Validators.maxLength(250)]],
      mmMenu: [null, [Validators.maxLength(250)]],
      mmTime: [null, [Validators.maxLength(250)]],
      lunchMenu: [null, [Validators.maxLength(250)]],
      lunchTime: [null, [Validators.maxLength(250)]],
      eveMenu: [null, [Validators.maxLength(250)]],
      eveTime: [null, [Validators.maxLength(250)]],
      midEveMenu: [null, [Validators.maxLength(250)]],
      midEveTime: [null, [Validators.maxLength(250)]],
      dinnerMenu: [null, [Validators.maxLength(250)]],
      dinnerTime: [null, [Validators.maxLength(250)]],
      nightSnacks: [null, [Validators.maxLength(250)]],
      bedTime: [null, [Validators.maxLength(250)]],
      fruitsFrequency: [null, [Validators.maxLength(250)]],
      breakFrequency: [null, [Validators.maxLength(250)]],
      breadAmount: [null, [Validators.maxLength(250)]],
      sweetFrequency: [null, [Validators.maxLength(250)]],
      sweetAmount: [null, [Validators.maxLength(250)]],
      teaFrequency: [null, [Validators.maxLength(250)]],
      teaAmount: [null, [Validators.maxLength(250)]],
      remark: [null, [Validators.maxLength(InputLengthEnum.CHAR_2000)]],
      nutritionistSummery: [null, [Validators.maxLength(InputLengthEnum.CHAR_2000)]]
    });
  }

  async loadMasterData(): Promise<void> {
    const assessmentMaster = await this.apiService.getAssessmentMaster();
    this.genderOptions = assessmentMaster.gender;
    this.maritalStatusOptions = assessmentMaster.maritalStatus;
    this.religionOptions = assessmentMaster.religion;
    this.lifestyleOptions = assessmentMaster.lifestyle;
    this.eatingHabitOptions = assessmentMaster.eatingHabit;
    this.typeOfExerciseOptions = assessmentMaster.typeOfExercise;
    this.sleepingPatternOptions = assessmentMaster.sleepingPattern;
    this.bloodSugarOptions = assessmentMaster.bloodSugar;
    this.urineOutputOptions = assessmentMaster.urineOutput;
  }

  async loadAssessment(): Promise<void> {
    this.loading = true;
    try {
      this.assessment = await this.apiService.getAssessment(this.memberId);
      if (this.assessment) {
        this.populateForm(this.assessment);
      }
    } catch (error) {
      this.snackBar.open('Failed to load assessment. Please try again.', 'Close', {
        duration: 5000,
      });
    } finally {
      this.loading = false;
    }
  }

  private populateForm(assessment: IMemberAssessment): void {
    this.formGroup.patchValue({
      dateOfBirth: assessment.dateOfBirth ? new Date(assessment.dateOfBirth) : null,
      age: assessment.age,
      genderId: assessment.genderId,
      maritalStatusId: assessment.maritalStatusId,
      religionId: assessment.religionId,
      lifestyleId: assessment.lifestyleId,
      eatingHabitId: assessment.eatingHabitId,
      tobaccoAmount: assessment.tobaccoAmount,
      tobaccoFrequency: assessment.tobaccoFrequency,
      paan: assessment.paan,
      smokingAmount: assessment.smokingAmount,
      smokingFrequency: assessment.smokingFrequency,
      alcoholDrink: assessment.alcoholDrink,
      alcoholFrequency: assessment.alcoholFrequency,
      alcoholAmount: assessment.alcoholAmount,
      aeratedDrinks: assessment.aeratedDrinks,
      waterIntake: assessment.waterIntake,
      religious: assessment.religious,
      fasting: assessment.fasting,
      restaurantVisit: assessment.restaurantVisit,
      preferredCuisine: assessment.preferredCuisine,
      whoCooks: assessment.whoCooks,
      hungerPeak: assessment.hungerPeak,
      foodDislikes: assessment.foodDislikes,
      otherFoodPreferences: assessment.otherFoodPreferences,
      doYouExercise: assessment.doYouExercise,
      typeOfExerciseId: assessment.typeOfExerciseId,
      frequency: assessment.frequency,
      duration: assessment.duration,
      time: assessment.time,
      allergies: assessment.allergies,
      allergySpecify: assessment.allergySpecify,
      sleepingPatternId: assessment.sleepingPatternId,
      sleepDuration: assessment.sleepDuration,
      gas: assessment.gas,
      hyperAcidity: assessment.hyperAcidity,
      constipation: assessment.constipation,
      periods: assessment.periods,
      lmp: assessment.lmp,
      daysCycle: assessment.daysCycle,
      hairFall: assessment.hairFall,
      kneePain: assessment.kneePain,
      backPain: assessment.backPain,
      bloodSugarId: assessment.bloodSugarId,
      bloodSugarValue: assessment.bloodSugarValue,
      cholesterol: assessment.cholesterol,
      triglycerides: assessment.triglycerides,
      hdlCholesterol: assessment.hdlCholesterol,
      ldlCholesterol: assessment.ldlCholesterol,
      vldlCholesterol: assessment.vldlCholesterol,
      hgLevel: assessment.hgLevel,
      urineOutputId: assessment.urineOutputId,
      supplementMedicine: assessment.supplementMedicine,
      wakeupTiming: assessment.wakeupTiming,
      bfMenu: assessment.bfMenu,
      bfTime: assessment.bfTime,
      mmMenu: assessment.mmMenu,
      mmTime: assessment.mmTime,
      lunchMenu: assessment.lunchMenu,
      lunchTime: assessment.lunchTime,
      eveMenu: assessment.eveMenu,
      eveTime: assessment.eveTime,
      midEveMenu: assessment.midEveMenu,
      midEveTime: assessment.midEveTime,
      dinnerMenu: assessment.dinnerMenu,
      dinnerTime: assessment.dinnerTime,
      nightSnacks: assessment.nightSnacks,
      bedTime: assessment.bedTime,
      fruitsFrequency: assessment.fruitsFrequency,
      breakFrequency: assessment.breakFrequency,
      breadAmount: assessment.breadAmount,
      sweetFrequency: assessment.sweetFrequency,
      sweetAmount: assessment.sweetAmount,
      teaFrequency: assessment.teaFrequency,
      teaAmount: assessment.teaAmount,
      remark: assessment.remark,
      nutritionistSummery: assessment.nutritionistSummery
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.assessment) {
      // Reset form to original values
      this.populateForm(this.assessment);
    }
  }

  async onUpdate(): Promise<void> {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    try {
      const formValue = this.formGroup.value;
      const assessmentData: IManageMemberAssessment = {
        memberId: this.memberId,
        ...formValue,
        dateOfBirth: CommonUtil.formatDateForAPI(formValue.dateOfBirth) || undefined
      };
      await this.apiService.updateAssessment(this.memberId, assessmentData);
      await this.loadAssessment();
      this.snackBar.open('Assessment updated successfully', 'Close', {
        duration: 3000,
      });
      this.isEditMode = false;
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  onCancel(): void {
    this.isEditMode = false;
    if (this.assessment) {
      this.populateForm(this.assessment);
    }
  }

  getFieldValue(field: keyof IMemberAssessment): any {
    return this.assessment?.[field] || '-';
  }
}
