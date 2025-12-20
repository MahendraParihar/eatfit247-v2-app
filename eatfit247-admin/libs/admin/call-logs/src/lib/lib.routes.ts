import { Route } from '@angular/router';
import { CallLogs } from './call-logs.component';
import { ManageCallLog } from './manage/manage-call-log.component';

export const callLogsRoutes: Route[] = [
  { path: '', component: CallLogs, title: 'Call Logs' },
  { path: 'new', component: ManageCallLog, title: 'Create Call Log' },
  { path: 'edit/:id', component: ManageCallLog, title: 'Edit Call Log' }
];
