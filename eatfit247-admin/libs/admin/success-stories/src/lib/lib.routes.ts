import { Route } from '@angular/router';
import { SuccessStories } from './success-stories.component';
import { ManageSuccessStory } from './manage/manage-success-story.component';

export const successStoriesRoutes: Route[] = [
  { path: '', component: SuccessStories, title: 'Success Stories' },
  { path: 'new', component: ManageSuccessStory, title: 'Create Success Story' },
  { path: 'edit/:id', component: ManageSuccessStory, title: 'Edit Success Story' }
];

