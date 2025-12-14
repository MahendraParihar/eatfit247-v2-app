import { Route } from '@angular/router';
import { PocketGuide } from './pocket-guide/pocket-guide';

export const pocketGuideRoutes: Route[] = [
  { path: '', component: PocketGuide, title: 'Pocket Guide' },
];
