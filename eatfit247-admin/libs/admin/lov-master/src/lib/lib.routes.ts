import { Route } from '@angular/router';
import { Gender } from './gender/gender.component';
import { BloodSugar } from './blood-sugar/blood-sugar.component';
import { HealthIssue } from './health-issue/health-issue.component';
import { EatingHabit } from './eating-habit/eating-habit.component';
import { Lifestyle } from './lifestyle/lifestyle.component';
import { MaritalStatus } from './marital-status/marital-status.component';
import { Religion } from './religion/religion.component';
import { SleepingPattern } from './sleeping-pattern/sleeping-pattern.component';
import { TypeOfExercise } from './type-of-exercise/type-of-exercise.component';
import { UrineOutput } from './urine-output/urine-output.component';
import { HealthParameter } from './health-parameter/health-parameter.component';
import { ManageHealthParameter } from './health-parameter/manage/manage-health-parameter.component';
// Call Logs
import { CallPurpose } from './call-purpose/call-purpose.component';
import { CallLogStatus } from './call-log-status/call-log-status.component';
import { CallType } from './call-type/call-type.component';
import { ManageCallType } from './call-type/manage/manage-call-type.component';
import { ManageGender } from './gender/manage/manage-gender.component';
import { ManageBloodSugar } from './blood-sugar/manage/manage-blood-sugar.component';
import { ManageHealthIssue } from './health-issue/manage/manage-health-issue.component';
import { ManageEatingHabit } from './eating-habit/manage/manage-eating-habit.component';
import { ManageLifestyle } from './lifestyle/manage/manage-lifestyle.component';
import { ManageMaritalStatus } from './marital-status/manage/manage-marital-status.component';
import { ManageReligion } from './religion/manage/manage-religion.component';
import { ManageSleepingPattern } from './sleeping-pattern/manage/manage-sleeping-pattern.component';
import { ManageTypeOfExercise } from './type-of-exercise/manage/manage-type-of-exercise.component';
import { ManageUrineOutput } from './urine-output/manage/manage-urine-output.component';
import { ManageCallPurpose } from './call-purpose/manage/manage-call-purpose.component';
import { ManageCallLogStatus } from './call-log-status/manage/manage-call-log-status.component';
import { ManageRecipeCuisine } from './recipe-cuisine/manage/manage-recipe-cuisine.component';
import { ManageRecipeType } from './recipe-type/manage/manage-recipe-type.component';
import { ManageRecipeCategory } from './recipe-category/manage/manage-recipe-category.component';
// Blogs
import { BlogAuthor } from './blog-author/blog-author.component';
import { ManageBlogAuthor } from './blog-author/manage/manage-blog-author.component';
import { BlogCategory } from './blog-category/blog-category.component';
import { ManageBlogCategory } from './blog-category/manage/manage-blog-category.component';
import { BlogComments } from './blog-comments/blog-comments.component';
// FAQ
import { FaqCategory } from './faq-category/faq-category.component';
import { ManageFaqCategory } from './faq-category/manage/manage-faq-category.component';
// Issues
import { IssueCategory } from './issue-category/issue-category.component';
import { IssueStatus } from './issue-status/issue-status.component';
// Programs
import { ProgramCategory } from './program-category/program-category.component';
import { ManageProgramCategory } from './program-category/manage/manage-program-category.component';
// Recipes
import { RecipeCategory } from './recipe-category/recipe-category.component';
import { RecipeCuisine } from './recipe-cuisine/recipe-cuisine.component';
import { RecipeType } from './recipe-type/recipe-type.component';
// Locations
import { Country } from './country/country.component';
import { ManageCountry } from './country/manage/manage-country.component';
import { State } from './state/state.component';
import { ManageState } from './state/manage/manage-state.component';

export const lovMasterRoutes: Route[] = [
  // Assessment Master items
  { path: 'gender', component: Gender, title: 'Gender' },
  { path: 'gender/new', component: ManageGender, title: 'Create Gender' },
  { path: 'gender/edit/:id', component: ManageGender, title: 'Edit Gender' },
  { path: 'blood-sugar', component: BloodSugar, title: 'Blood Sugar' },
  { path: 'blood-sugar/new', component: ManageBloodSugar, title: 'Create Blood Sugar' },
  { path: 'blood-sugar/edit/:id', component: ManageBloodSugar, title: 'Edit Blood Sugar' },
  { path: 'health-issue', component: HealthIssue, title: 'Health Issue' },
  { path: 'health-issue/new', component: ManageHealthIssue, title: 'Create Health Issue' },
  { path: 'health-issue/edit/:id', component: ManageHealthIssue, title: 'Edit Health Issue' },
  { path: 'eating-habit', component: EatingHabit, title: 'Eating Habit' },
  { path: 'eating-habit/new', component: ManageEatingHabit, title: 'Create Eating Habit' },
  { path: 'eating-habit/edit/:id', component: ManageEatingHabit, title: 'Edit Eating Habit' },
  { path: 'lifestyle', component: Lifestyle, title: 'Lifestyle' },
  { path: 'lifestyle/new', component: ManageLifestyle, title: 'Create Lifestyle' },
  { path: 'lifestyle/edit/:id', component: ManageLifestyle, title: 'Edit Lifestyle' },
  { path: 'marital-status', component: MaritalStatus, title: 'Marital Status' },
  { path: 'marital-status/new', component: ManageMaritalStatus, title: 'Create Marital Status' },
  { path: 'marital-status/edit/:id', component: ManageMaritalStatus, title: 'Edit Marital Status' },
  { path: 'religion', component: Religion, title: 'Religion' },
  { path: 'religion/new', component: ManageReligion, title: 'Create Religion' },
  { path: 'religion/edit/:id', component: ManageReligion, title: 'Edit Religion' },
  { path: 'sleeping-pattern', component: SleepingPattern, title: 'Sleeping Pattern' },
  { path: 'sleeping-pattern/new', component: ManageSleepingPattern, title: 'Create Sleeping Pattern' },
  { path: 'sleeping-pattern/edit/:id', component: ManageSleepingPattern, title: 'Edit Sleeping Pattern' },
  { path: 'type-of-exercise', component: TypeOfExercise, title: 'Type of Exercise' },
  { path: 'type-of-exercise/new', component: ManageTypeOfExercise, title: 'Create Type of Exercise' },
  { path: 'type-of-exercise/edit/:id', component: ManageTypeOfExercise, title: 'Edit Type of Exercise' },
  { path: 'urine-output', component: UrineOutput, title: 'Urine Output' },
  { path: 'urine-output/new', component: ManageUrineOutput, title: 'Create Urine Output' },
  { path: 'urine-output/edit/:id', component: ManageUrineOutput, title: 'Edit Urine Output' },
  { path: 'health-parameter', component: HealthParameter, title: 'Health Parameter' },
  { path: 'health-parameter/new', component: ManageHealthParameter, title: 'Create Health Parameter' },
  { path: 'health-parameter/edit/:id', component: ManageHealthParameter, title: 'Edit Health Parameter' },
  // Call Logs
  { path: 'call-purpose', component: CallPurpose, title: 'Call Purpose' },
  { path: 'call-purpose/new', component: ManageCallPurpose, title: 'Create Call Purpose' },
  { path: 'call-purpose/edit/:id', component: ManageCallPurpose, title: 'Edit Call Purpose' },
  { path: 'call-log-status', component: CallLogStatus, title: 'Call Log Status' },
  { path: 'call-log-status/new', component: ManageCallLogStatus, title: 'Create Call Log Status' },
  { path: 'call-log-status/edit/:id', component: ManageCallLogStatus, title: 'Edit Call Log Status' },
  { path: 'call-type', component: CallType, title: 'Call Type' },
  { path: 'call-type/new', component: ManageCallType, title: 'Create Call Type' },
  { path: 'call-type/edit/:id', component: ManageCallType, title: 'Edit Call Type' },
  // Blogs
  { path: 'blog-author', component: BlogAuthor, title: 'Blog Author' },
  { path: 'blog-author/new', component: ManageBlogAuthor, title: 'Create Blog Author' },
  { path: 'blog-author/edit/:id', component: ManageBlogAuthor, title: 'Edit Blog Author' },
  { path: 'blog-category', component: BlogCategory, title: 'Blog Category' },
  { path: 'blog-category/new', component: ManageBlogCategory, title: 'Create Blog Category' },
  { path: 'blog-category/edit/:id', component: ManageBlogCategory, title: 'Edit Blog Category' },
  { path: 'blog-comments', component: BlogComments, title: 'Blog Comments' },
  // FAQ
  { path: 'faq-category', component: FaqCategory, title: 'FAQ Category' },
  { path: 'faq-category/new', component: ManageFaqCategory, title: 'Create FAQ Category' },
  { path: 'faq-category/edit/:id', component: ManageFaqCategory, title: 'Edit FAQ Category' },
  // Issues
  { path: 'issue-category', component: IssueCategory, title: 'Issue Category' },
  { path: 'issue-status', component: IssueStatus, title: 'Issue Status' },
  // Programs
  { path: 'program-category', component: ProgramCategory, title: 'Program Category' },
  { path: 'program-category/new', component: ManageProgramCategory, title: 'Create Program Category' },
  { path: 'program-category/edit/:id', component: ManageProgramCategory, title: 'Edit Program Category' },
  // Recipes
  { path: 'recipe-category', component: RecipeCategory, title: 'Recipe Category' },
  { path: 'recipe-category/new', component: ManageRecipeCategory, title: 'Create Recipe Category' },
  { path: 'recipe-category/edit/:id', component: ManageRecipeCategory, title: 'Edit Recipe Category' },
  { path: 'recipe-cuisine', component: RecipeCuisine, title: 'Recipe Cuisine' },
  { path: 'recipe-cuisine/new', component: ManageRecipeCuisine, title: 'Create Recipe Cuisine' },
  { path: 'recipe-cuisine/edit/:id', component: ManageRecipeCuisine, title: 'Edit Recipe Cuisine' },
  { path: 'recipe-type', component: RecipeType, title: 'Recipe Type' },
  { path: 'recipe-type/new', component: ManageRecipeType, title: 'Create Recipe Type' },
  { path: 'recipe-type/edit/:id', component: ManageRecipeType, title: 'Edit Recipe Type' },
  // Locations
  { path: 'country', component: Country, title: 'Country' },
  { path: 'country/new', component: ManageCountry, title: 'Create Country' },
  { path: 'country/edit/:id', component: ManageCountry, title: 'Edit Country' },
  { path: 'state', component: State, title: 'State' },
  { path: 'state/new', component: ManageState, title: 'Create State' },
  { path: 'state/edit/:id', component: ManageState, title: 'Edit State' }
];
