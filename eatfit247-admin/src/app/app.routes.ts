import { Route } from '@angular/router';
import { AuthGuard, LoginGuard } from '@core';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { BaseLayoutComponent } from '@shared';

export const appRoutes: Route[] = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard],
    title: 'Login',
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'Forgot Password',
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Reset Password',
  },
  {
    path: '',
    component: BaseLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'lov-master',
        loadChildren: () => import('lov-master').then((m) => m.lovMasterRoutes),
      },
      {
        path: 'members',
        loadChildren: () => import('members').then((m) => m.membersRoutes),
      },
      {
        path: 'blogs',
        loadChildren: () => import('blogs').then((m) => m.blogsRoutes),
      },
      {
        path: 'faq',
        loadChildren: () => import('faq').then((m) => m.faqRoutes),
      },
      {
        path: 'recipes',
        loadChildren: () => import('recipes').then((m) => m.recipesRoutes),
      },
      {
        path: 'programs',
        loadChildren: () => import('programs').then((m) => m.programsRoutes),
      },
      {
        path: 'media-press',
        loadChildren: () => import('media-press').then((m) => m.mediaPressRoutes),
      },
      {
        path: 'referrer',
        loadChildren: () => import('referrer').then((m) => m.referrerRoutes),
      },
      {
        path: 'franchise',
        loadChildren: () => import('franchise').then((m) => m.franchiseRoutes),
      },
      {
        path: 'pocket-guide',
        loadChildren: () => import('pocket-guide').then((m) => m.pocketGuideRoutes),
      },
      {
        path: 'call-logs',
        loadChildren: () => import('call-logs').then((m) => m.callLogsRoutes),
      },
      {
        path: 'issues',
        loadChildren: () => import('issues').then((m) => m.issuesRoutes),
      },
      {
        path: 'admin-user',
        loadChildren: () => import('admin-user').then((m) => m.adminUserRoutes),
      },
      {
        path: '',
        redirectTo: 'members',
        pathMatch: 'full',
      },
    ],
  },
];
