import { Route } from '@angular/router';
import { MediaPress } from './media-press.component';
import { ManageMediaPress } from './manage/manage-media-press.component';

export const mediaPressRoutes: Route[] = [
  { path: '', component: MediaPress, title: 'Media & Press' },
  { path: 'new', component: ManageMediaPress, title: 'Create Media & Press' },
  { path: 'edit/:id', component: ManageMediaPress, title: 'Edit Media & Press' }
];
