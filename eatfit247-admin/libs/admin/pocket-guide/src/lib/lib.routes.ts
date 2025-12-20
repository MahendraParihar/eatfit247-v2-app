import { Route } from '@angular/router';
import { PocketGuide } from './pocket-guide/pocket-guide.component';

export const pocketGuideRoutes: Route[] = [
  { path: '', component: PocketGuide, title: 'Pocket Guide' },
];
