import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { BlogAuthorListComponent } from './blog-author-list/blog-author-list.component';
import { BlogAuthorManageComponent } from './blog-author-manage/blog-author-manage.component';
import { BlogCategoryListComponent } from './blog-category-list/blog-category-list.component';
import { BlogCategoryManageComponent } from './blog-category-manage/blog-category-manage.component';
import { CallTypeListComponent } from './call-type-list/call-type-list.component';
import { CallTypeManageComponent } from './call-type-manage/call-type-manage.component';
import { CallPurposeListComponent } from './call-purpose-list/call-purpose-list.component';
import { CallPurposeManageComponent } from './call-purpose-manage/call-purpose-manage.component';
import { CountryListComponent } from './country-list/country-list.component';
import { CountryManageComponent } from './country-manage/country-manage.component';
import { StateListComponent } from './state-list/state-list.component';
import { StateManageComponent } from './state-manage/state-manage.component';
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
import { NutritiveListComponent } from './nutritive-list/nutritive-list.component';
import { NutritiveManageComponent } from './nutritive-manage/nutritive-manage.component';
import { RecipeCategoryListComponent } from './recipe-category-list/recipe-category-list.component';
import { RecipeCategoryManageComponent } from './recipe-category-manage/recipe-category-manage.component';
import { RecipeCuisineListComponent } from './recipe-cuisine-list/recipe-cuisine-list.component';
import { RecipeCuisineManageComponent } from './recipe-cuisine-manage/recipe-cuisine-manage.component';
import { ReligionListComponent } from './religion-list/religion-list.component';
import { ReligionManageComponent } from './religion-manage/religion-manage.component';
import { SleepingPatternListComponent } from './sleeping-pattern-list/sleeping-pattern-list.component';
import { SleepingPatternManageComponent } from './sleeping-pattern-manage/sleeping-pattern-manage.component';
import { TypeOfExerciseListComponent } from './type-of-exercise-list/type-of-exercise-list.component';
import { TypeOfExerciseManageComponent } from './type-of-exercise-manage/type-of-exercise-manage.component';
import { BloodSugarListComponent } from './blood-sugar-list/blood-sugar-list.component';
import { BloodSugarManageComponent } from './blood-sugar-manage/blood-sugar-manage.component';
import { UrineOutputListComponent } from './urine-output-list/urine-output-list.component';
import { UrineOutputManageComponent } from './urine-output-manage/urine-output-manage.component';
import { FaqCategoryListComponent } from './faq-category-list/faq-category-list.component';
import { FaqCategoryManageComponent } from './faq-category-manage/faq-category-manage.component';
import { ProgramCategoryListComponent } from './program-category-list/program-category-list.component';
import { ProgramCategoryManageComponent } from './program-category-manage/program-category-manage.component';

const routes: Routes = [
  {
    path: 'blog-author-list',
    canActivate: [AuthGuard],
    component: BlogAuthorListComponent,
  },
  {
    path: 'blog-author-manage',
    canActivate: [AuthGuard],
    component: BlogAuthorManageComponent,
  },
  {
    path: 'blog-author-manage/:id',
    canActivate: [AuthGuard],
    component: BlogAuthorManageComponent,
  },
  {
    path: 'blog-category-list',
    canActivate: [AuthGuard],
    component: BlogCategoryListComponent,
  },
  {
    path: 'blog-category-manage',
    canActivate: [AuthGuard],
    component: BlogCategoryManageComponent,
  },
  {
    path: 'blog-category-manage/:id',
    canActivate: [AuthGuard],
    component: BlogCategoryManageComponent,
  },
  {
    path: 'call-type-list',
    canActivate: [AuthGuard],
    component: CallTypeListComponent,
  },
  {
    path: 'call-type-manage',
    canActivate: [AuthGuard],
    component: CallTypeManageComponent,
  },
  {
    path: 'call-type-manage/:id',
    canActivate: [AuthGuard],
    component: CallTypeManageComponent,
  },
  {
    path: 'call-purpose-list',
    canActivate: [AuthGuard],
    component: CallPurposeListComponent,
  },
  {
    path: 'call-purpose-manage',
    canActivate: [AuthGuard],
    component: CallPurposeManageComponent,
  },
  {
    path: 'call-purpose-manage/:id',
    canActivate: [AuthGuard],
    component: CallPurposeManageComponent,
  },
  {
    path: 'country-list',
    canActivate: [AuthGuard],
    component: CountryListComponent,
  },
  {
    path: 'country-manage',
    canActivate: [AuthGuard],
    component: CountryManageComponent,
  },
  {
    path: 'country-manage/:id',
    canActivate: [AuthGuard],
    component: CountryManageComponent,
  },
  {
    path: 'state-list',
    canActivate: [AuthGuard],
    component: StateListComponent,
  },
  {
    path: 'state-manage',
    canActivate: [AuthGuard],
    component: StateManageComponent,
  },
  {
    path: 'state-manage/:id',
    canActivate: [AuthGuard],
    component: StateManageComponent,
  },
  {
    path: 'blood-sugar-list',
    canActivate: [AuthGuard],
    component: BloodSugarListComponent,
  },
  {
    path: 'blood-sugar-manage',
    canActivate: [AuthGuard],
    component: BloodSugarManageComponent,
  },
  {
    path: 'blood-sugar-manage/:id',
    canActivate: [AuthGuard],
    component: BloodSugarManageComponent,
  },
  {
    path: 'eating-habit-list',
    canActivate: [AuthGuard],
    component: EatingHabitListComponent,
  },
  {
    path: 'eating-habit-manage',
    canActivate: [AuthGuard],
    component: EatingHabitManageComponent,
  },
  {
    path: 'eating-habit-manage/:id',
    canActivate: [AuthGuard],
    component: EatingHabitManageComponent,
  },
  {
    path: 'gender-list',
    canActivate: [AuthGuard],
    component: GenderListComponent,
  },
  {
    path: 'gender-manage',
    canActivate: [AuthGuard],
    component: GenderManageComponent,
  },
  {
    path: 'gender-manage/:id',
    canActivate: [AuthGuard],
    component: GenderManageComponent,
  },
  {
    path: 'health-parameter-list',
    canActivate: [AuthGuard],
    component: HealthParameterListComponent,
  },
  {
    path: 'health-parameter-manage',
    canActivate: [AuthGuard],
    component: HealthParameterManageComponent,
  },
  {
    path: 'health-parameter-manage/:id',
    canActivate: [AuthGuard],
    component: HealthParameterManageComponent,
  },
  {
    path: 'lifestyle-list',
    canActivate: [AuthGuard],
    component: LifestyleListComponent,
  },
  {
    path: 'lifestyle-manage',
    canActivate: [AuthGuard],
    component: LifestyleManageComponent,
  },
  {
    path: 'lifestyle-manage/:id',
    canActivate: [AuthGuard],
    component: LifestyleManageComponent,
  },
  {
    path: 'marital-status-list',
    canActivate: [AuthGuard],
    component: MaritalStatusListComponent,
  },
  {
    path: 'marital-status-manage',
    canActivate: [AuthGuard],
    component: MaritalStatusManageComponent,
  },
  {
    path: 'marital-status-manage/:id',
    canActivate: [AuthGuard],
    component: MaritalStatusManageComponent,
  },
  {
    path: 'nutritive-list',
    canActivate: [AuthGuard],
    component: NutritiveListComponent,
  },
  {
    path: 'nutritive-manage',
    canActivate: [AuthGuard],
    component: NutritiveManageComponent,
  },
  {
    path: 'nutritive-manage/:id',
    canActivate: [AuthGuard],
    component: NutritiveManageComponent,
  },
  {
    path: 'recipe-category-list',
    canActivate: [AuthGuard],
    component: RecipeCategoryListComponent,
  },
  {
    path: 'recipe-category-manage',
    canActivate: [AuthGuard],
    component: RecipeCategoryManageComponent,
  },
  {
    path: 'recipe-category-manage/:id',
    canActivate: [AuthGuard],
    component: RecipeCategoryManageComponent,
  },
  {
    path: 'recipe-cuisine-list',
    canActivate: [AuthGuard],
    component: RecipeCuisineListComponent,
  },
  {
    path: 'recipe-cuisine-manage',
    canActivate: [AuthGuard],
    component: RecipeCuisineManageComponent,
  },
  {
    path: 'recipe-cuisine-manage/:id',
    canActivate: [AuthGuard],
    component: RecipeCuisineManageComponent,
  },
  {
    path: 'religion-list',
    canActivate: [AuthGuard],
    component: ReligionListComponent,
  },
  {
    path: 'religion-manage',
    canActivate: [AuthGuard],
    component: ReligionManageComponent,
  },
  {
    path: 'religion-manage/:id',
    canActivate: [AuthGuard],
    component: ReligionManageComponent,
  },
  {
    path: 'sleeping-pattern-list',
    canActivate: [AuthGuard],
    component: SleepingPatternListComponent,
  },
  {
    path: 'sleeping-pattern-manage',
    canActivate: [AuthGuard],
    component: SleepingPatternManageComponent,
  },
  {
    path: 'sleeping-pattern-manage/:id',
    canActivate: [AuthGuard],
    component: SleepingPatternManageComponent,
  },
  {
    path: 'type-of-exercise-list',
    canActivate: [AuthGuard],
    component: TypeOfExerciseListComponent,
  },
  {
    path: 'type-of-exercise-manage',
    canActivate: [AuthGuard],
    component: TypeOfExerciseManageComponent,
  },
  {
    path: 'type-of-exercise-manage/:id',
    canActivate: [AuthGuard],
    component: TypeOfExerciseManageComponent,
  },
  {
    path: 'urine-output-list',
    canActivate: [AuthGuard],
    component: UrineOutputListComponent,
  },
  {
    path: 'urine-output-manage',
    canActivate: [AuthGuard],
    component: UrineOutputManageComponent,
  },
  {
    path: 'urine-output-manage/:id',
    canActivate: [AuthGuard],
    component: UrineOutputManageComponent,
  },
  {
    path: 'faq-category-list',
    canActivate: [AuthGuard],
    component: FaqCategoryListComponent,
  },
  {
    path: 'faq-category-manage',
    canActivate: [AuthGuard],
    component: FaqCategoryManageComponent,
  },
  {
    path: 'faq-category-manage/:id',
    canActivate: [AuthGuard],
    component: FaqCategoryManageComponent,
  },
  {
    path: 'program-category-list',
    canActivate: [AuthGuard],
    component: ProgramCategoryListComponent,
  },
  {
    path: 'program-category-manage',
    canActivate: [AuthGuard],
    component: ProgramCategoryManageComponent,
  },
  {
    path: 'program-category-manage/:id',
    canActivate: [AuthGuard],
    component: ProgramCategoryManageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LovRoutingModule {
}
