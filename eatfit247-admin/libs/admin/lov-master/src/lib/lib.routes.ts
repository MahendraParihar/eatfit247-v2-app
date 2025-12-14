import { Route } from '@angular/router';
import { Gender } from './gender/gender';
import { BloodSugar } from './blood-sugar/blood-sugar';
import { HealthIssue } from './health-issue/health-issue';
import { EatingHabit } from './eating-habit/eating-habit';
import { Lifestyle } from './lifestyle/lifestyle';
import { MaritalStatus } from './marital-status/marital-status';
import { Religion } from './religion/religion';
import { SleepingPattern } from './sleeping-pattern/sleeping-pattern';
import { TypeOfExercise } from './type-of-exercise/type-of-exercise';
import { UrineOutput } from './urine-output/urine-output';
import { HealthParameter } from './health-parameter/health-parameter';
// Call Logs
import { CallPurpose } from './call-purpose/call-purpose';
import { CallLogStatus } from './call-log-status/call-log-status';
import { CallType } from './call-type/call-type';
import { ManageCallType } from './call-type/manage/manage-call-type';
// Blogs
import { BlogAuthor } from './blog-author/blog-author';
import { BlogCategory } from './blog-category/blog-category';
import { BlogComments } from './blog-comments/blog-comments';
// FAQ
import { FaqCategory } from './faq-category/faq-category';
// Issues
import { IssueCategory } from './issue-category/issue-category';
import { IssueStatus } from './issue-status/issue-status';
// Programs
import { ProgramCategory } from './program-category/program-category';
// Recipes
import { RecipeCategory } from './recipe-category/recipe-category';
import { RecipeCuisine } from './recipe-cuisine/recipe-cuisine';
import { RecipeType } from './recipe-type/recipe-type';
// Locations
import { Country } from './country/country';
import { State } from './state/state';

export const lovMasterRoutes: Route[] = [
  // Assessment Master items
  { path: 'gender', component: Gender, title: 'Gender' },
  { path: 'blood-sugar', component: BloodSugar, title: 'Blood Sugar' },
  { path: 'health-issue', component: HealthIssue, title: 'Health Issue' },
  { path: 'eating-habit', component: EatingHabit, title: 'Eating Habit' },
  { path: 'lifestyle', component: Lifestyle, title: 'Lifestyle' },
  { path: 'marital-status', component: MaritalStatus, title: 'Marital Status' },
  { path: 'religion', component: Religion, title: 'Religion' },
  { path: 'sleeping-pattern', component: SleepingPattern, title: 'Sleeping Pattern' },
  { path: 'type-of-exercise', component: TypeOfExercise, title: 'Type of Exercise' },
  { path: 'urine-output', component: UrineOutput, title: 'Urine Output' },
  { path: 'health-parameter', component: HealthParameter, title: 'Health Parameter' },
  // Call Logs
  { path: 'call-purpose', component: CallPurpose, title: 'Call Purpose' },
  { path: 'call-log-status', component: CallLogStatus, title: 'Call Log Status' },
  { path: 'call-type', component: CallType, title: 'Call Type' },
  { path: 'call-type/new', component: ManageCallType, title: 'Create Call Type' },
  { path: 'call-type/edit/:id', component: ManageCallType, title: 'Edit Call Type' },
  // Blogs
  { path: 'blog-author', component: BlogAuthor, title: 'Blog Author' },
  { path: 'blog-category', component: BlogCategory, title: 'Blog Category' },
  { path: 'blog-comments', component: BlogComments, title: 'Blog Comments' },
  // FAQ
  { path: 'faq-category', component: FaqCategory, title: 'FAQ Category' },
  // Issues
  { path: 'issue-category', component: IssueCategory, title: 'Issue Category' },
  { path: 'issue-status', component: IssueStatus, title: 'Issue Status' },
  // Programs
  { path: 'program-category', component: ProgramCategory, title: 'Program Category' },
  // Recipes
  { path: 'recipe-category', component: RecipeCategory, title: 'Recipe Category' },
  { path: 'recipe-cuisine', component: RecipeCuisine, title: 'Recipe Cuisine' },
  { path: 'recipe-type', component: RecipeType, title: 'Recipe Type' },
  // Locations
  { path: 'country', component: Country, title: 'Country' },
  { path: 'state', component: State, title: 'State' }
];
