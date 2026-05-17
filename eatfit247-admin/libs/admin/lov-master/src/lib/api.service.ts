import { Injectable } from '@angular/core';
import { CrudApiService } from '@core';
import {
  IBlogAuthor,
  IBlogCategory,
  IBlogComment,
  IBloodSugar,
  ICallLogStatus,
  ICallPurpose,
  ICallType,
  ICountry,
  IEatingHabit,
  IFaqCategory,
  IGender,
  IHealthIssue,
  IHealthParameter,
  IHealthParameterUnit,
  IIssueCategory,
  IIssueStatus,
  ILifestyle,
  IManageBlogAuthor,
  IManageBlogCategory,
  IManageBlogComment,
  IManageBloodSugar,
  IManageCallLogStatus,
  IManageCallPurpose,
  IManageCallType,
  IManageCountry,
  IManageEatingHabit,
  IManageFaqCategory,
  IManageGender,
  IManageHealthIssue,
  IManageHealthParameter,
  IManageHealthParameterUnit,
  IManageIssueCategory,
  IManageIssueStatus,
  IManageLifestyle,
  IManageMaritalStatus,
  IManageRecipeCategory,
  IManageRecipeCuisine,
  IManageRecipeType,
  IManageReligion,
  IManageSleepingPattern,
  IManageState,
  IManageTypeOfExercise,
  IManageUrineOutput,
  IMaritalStatus,
  IRecipeCategory,
  IRecipeCuisine,
  IRecipeType,
  IReligion,
  ISleepingPattern,
  IState,
  ITypeOfExercise,
  IUrineOutput
} from '@eatfit247-shared-lib';

// Assessment Masters
@Injectable({ providedIn: 'root' })
export class GenderApiService extends CrudApiService<IGender, IManageGender> {
  constructor() { super('/gender'); }
}

@Injectable({ providedIn: 'root' })
export class BloodSugarApiService extends CrudApiService<IBloodSugar, IManageBloodSugar> {
  constructor() { super('/blood-sugar'); }
}

@Injectable({ providedIn: 'root' })
export class HealthIssueApiService extends CrudApiService<IHealthIssue, IManageHealthIssue> {
  constructor() { super('/health-issue'); }
}

@Injectable({ providedIn: 'root' })
export class EatingHabitApiService extends CrudApiService<IEatingHabit, IManageEatingHabit> {
  constructor() { super('/eating-habit'); }
}

@Injectable({ providedIn: 'root' })
export class LifestyleApiService extends CrudApiService<ILifestyle, IManageLifestyle> {
  constructor() { super('/lifestyle'); }
}

@Injectable({ providedIn: 'root' })
export class MaritalStatusApiService extends CrudApiService<IMaritalStatus, IManageMaritalStatus> {
  constructor() { super('/marital-status'); }
}

@Injectable({ providedIn: 'root' })
export class ReligionApiService extends CrudApiService<IReligion, IManageReligion> {
  constructor() { super('/religion'); }
}

@Injectable({ providedIn: 'root' })
export class SleepingPatternApiService extends CrudApiService<ISleepingPattern, IManageSleepingPattern> {
  constructor() { super('/sleeping-pattern'); }
}

@Injectable({ providedIn: 'root' })
export class TypeOfExerciseApiService extends CrudApiService<ITypeOfExercise, IManageTypeOfExercise> {
  constructor() { super('/type-of-exercise'); }
}

@Injectable({ providedIn: 'root' })
export class UrineOutputApiService extends CrudApiService<IUrineOutput, IManageUrineOutput> {
  constructor() { super('/urine-output'); }
}

@Injectable({ providedIn: 'root' })
export class HealthParameterApiService extends CrudApiService<IHealthParameter, IManageHealthParameter> {
  constructor() { super('/health-parameter'); }
}

@Injectable({ providedIn: 'root' })
export class HealthParameterUnitApiService extends CrudApiService<IHealthParameterUnit, IManageHealthParameterUnit> {
  constructor() { super('/health-parameter-unit'); }
}

// Call Logs
@Injectable({ providedIn: 'root' })
export class CallPurposeApiService extends CrudApiService<ICallPurpose, IManageCallPurpose> {
  constructor() { super('/call-purpose'); }
}

@Injectable({ providedIn: 'root' })
export class CallLogStatusApiService extends CrudApiService<ICallLogStatus, IManageCallLogStatus> {
  constructor() { super('/call-log-status'); }
}

@Injectable({ providedIn: 'root' })
export class CallTypeApiService extends CrudApiService<ICallType, IManageCallType> {
  constructor() { super('/call-type'); }
}

// Blogs
@Injectable({ providedIn: 'root' })
export class BlogAuthorApiService extends CrudApiService<IBlogAuthor, IManageBlogAuthor> {
  constructor() { super('/blog-author'); }
}

@Injectable({ providedIn: 'root' })
export class BlogCategoryApiService extends CrudApiService<IBlogCategory, IManageBlogCategory> {
  constructor() { super('/blog-category'); }
}

@Injectable({ providedIn: 'root' })
export class BlogCommentsApiService extends CrudApiService<IBlogComment, IManageBlogComment> {
  constructor() { super('/blog-comments'); }
}

// FAQ
@Injectable({ providedIn: 'root' })
export class FaqCategoryApiService extends CrudApiService<IFaqCategory, IManageFaqCategory> {
  constructor() { super('/faq-category'); }
}

// Issues
@Injectable({ providedIn: 'root' })
export class IssueCategoryApiService extends CrudApiService<IIssueCategory, IManageIssueCategory> {
  constructor() { super('/issue-category'); }
}

@Injectable({ providedIn: 'root' })
export class IssueStatusApiService extends CrudApiService<IIssueStatus, IManageIssueStatus> {
  constructor() { super('/issue-status'); }
}

// Recipes
@Injectable({ providedIn: 'root' })
export class RecipeCategoryApiService extends CrudApiService<IRecipeCategory, IManageRecipeCategory> {
  constructor() { super('/recipe-category'); }
}

@Injectable({ providedIn: 'root' })
export class RecipeCuisineApiService extends CrudApiService<IRecipeCuisine, IManageRecipeCuisine> {
  constructor() { super('/recipe-cuisine'); }
}

@Injectable({ providedIn: 'root' })
export class RecipeTypeApiService extends CrudApiService<IRecipeType, IManageRecipeType> {
  constructor() { super('/recipe-type'); }
}

// Locations
@Injectable({ providedIn: 'root' })
export class CountryApiService extends CrudApiService<ICountry, IManageCountry> {
  constructor() { super('/country'); }
}

@Injectable({ providedIn: 'root' })
export class StateApiService extends CrudApiService<IState, IManageState> {
  constructor() { super('/state'); }
}
