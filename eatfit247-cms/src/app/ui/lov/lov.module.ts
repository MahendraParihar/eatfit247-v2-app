import { NgModule } from '@angular/core';
import { LovRoutingModule } from './lov-routing.module';
import { MaterialModule } from '../../material.module';
import { ShareModule } from '../shared/share.module';
import { BloodSugarManageComponent } from './blood-sugar-manage/blood-sugar-manage.component';
import { BloodSugarListComponent } from './blood-sugar-list/blood-sugar-list.component';
import { EatingHabitListComponent } from './eating-habit-list/eating-habit-list.component';
import { EatingHabitManageComponent } from './eating-habit-manage/eating-habit-manage.component';
import { GenderListComponent } from './gender-list/gender-list.component';
import { GenderManageComponent } from './gender-manage/gender-manage.component';
import { HealthParameterListComponent } from './health-parameter-list/health-parameter-list.component';
import { HealthParameterManageComponent } from './health-parameter-manage/health-parameter-manage.component';
import { LifestyleListComponent } from './lifestyle-list/lifestyle-list.component';
import { LifestyleManageComponent } from './lifestyle-manage/lifestyle-manage.component';
import { MaritalStatusListComponent } from './marital-status-list/marital-status-list.component';
import { MaritalStatusManageComponent } from './marital-status-manage/marital-status-manage.component';
import { NutritiveManageComponent } from './nutritive-manage/nutritive-manage.component';
import { NutritiveListComponent } from './nutritive-list/nutritive-list.component';
import { RecipeCuisineListComponent } from './recipe-cuisine-list/recipe-cuisine-list.component';
import { RecipeCuisineManageComponent } from './recipe-cuisine-manage/recipe-cuisine-manage.component';
import { RecipeCategoryManageComponent } from './recipe-category-manage/recipe-category-manage.component';
import { RecipeCategoryListComponent } from './recipe-category-list/recipe-category-list.component';
import { ReligionManageComponent } from './religion-manage/religion-manage.component';
import { ReligionListComponent } from './religion-list/religion-list.component';
import { SleepingPatternListComponent } from './sleeping-pattern-list/sleeping-pattern-list.component';
import { SleepingPatternManageComponent } from './sleeping-pattern-manage/sleeping-pattern-manage.component';
import { TypeOfExerciseManageComponent } from './type-of-exercise-manage/type-of-exercise-manage.component';
import { TypeOfExerciseListComponent } from './type-of-exercise-list/type-of-exercise-list.component';
import { CallTypeListComponent } from './call-type-list/call-type-list.component';
import { CallTypeManageComponent } from './call-type-manage/call-type-manage.component';
import { CallPurposeManageComponent } from './call-purpose-manage/call-purpose-manage.component';
import { CallPurposeListComponent } from './call-purpose-list/call-purpose-list.component';
import { BlogCategoryListComponent } from './blog-category-list/blog-category-list.component';
import { BlogCategoryManageComponent } from './blog-category-manage/blog-category-manage.component';
import { BlogAuthorManageComponent } from './blog-author-manage/blog-author-manage.component';
import { BlogAuthorListComponent } from './blog-author-list/blog-author-list.component';
import { CountryListComponent } from './country-list/country-list.component';
import { CountryManageComponent } from './country-manage/country-manage.component';
import { StateManageComponent } from './state-manage/state-manage.component';
import { StateListComponent } from './state-list/state-list.component';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UrineOutputListComponent } from './urine-output-list/urine-output-list.component';
import { UrineOutputManageComponent } from './urine-output-manage/urine-output-manage.component';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { FaqCategoryListComponent } from './faq-category-list/faq-category-list.component';
import { FaqCategoryManageComponent } from './faq-category-manage/faq-category-manage.component';
import { ProgramCategoryListComponent } from './program-category-list/program-category-list.component';
import { ProgramCategoryManageComponent } from './program-category-manage/program-category-manage.component';

@NgModule({
  declarations: [
    BloodSugarManageComponent,
    BloodSugarListComponent,
    EatingHabitListComponent,
    EatingHabitManageComponent,
    GenderListComponent,
    GenderManageComponent,
    HealthParameterListComponent,
    HealthParameterManageComponent,
    LifestyleListComponent,
    LifestyleManageComponent,
    MaritalStatusListComponent,
    MaritalStatusManageComponent,
    NutritiveManageComponent,
    NutritiveListComponent,
    RecipeCuisineListComponent,
    RecipeCuisineManageComponent,
    RecipeCategoryManageComponent,
    RecipeCategoryListComponent,
    ReligionManageComponent,
    ReligionListComponent,
    SleepingPatternListComponent,
    SleepingPatternManageComponent,
    TypeOfExerciseManageComponent,
    TypeOfExerciseListComponent,
    CallTypeListComponent,
    CallTypeManageComponent,
    CallPurposeManageComponent,
    CallPurposeListComponent,
    BlogCategoryListComponent,
    BlogCategoryManageComponent,
    BlogAuthorManageComponent,
    BlogAuthorListComponent,
    CountryListComponent,
    CountryManageComponent,
    StateManageComponent,
    StateListComponent,
    UrineOutputListComponent,
    UrineOutputManageComponent,
    FaqCategoryListComponent,
    FaqCategoryManageComponent,
    ProgramCategoryListComponent,
    ProgramCategoryManageComponent,
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    LovRoutingModule,
    CommonModule,
    NgxMatTimepickerModule,
  ],
})
export class LovModule {
}
