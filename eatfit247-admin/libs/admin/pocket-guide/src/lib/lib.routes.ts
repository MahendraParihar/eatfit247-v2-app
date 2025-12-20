import { Route } from '@angular/router';
import { PocketGuide } from './pocket-guide.component';
import { ManagePocketGuide } from './manage/manage-pocket-guide.component';

export const pocketGuideRoutes: Route[] = [
  { path: '', component: PocketGuide, title: 'Pocket Guide' },
  { path: 'new', component: ManagePocketGuide, title: 'Create Pocket Guide' },
  { path: 'edit/:id', component: ManagePocketGuide, title: 'Edit Pocket Guide' }
];
