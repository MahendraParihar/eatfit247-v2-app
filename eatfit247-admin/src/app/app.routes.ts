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
        path: 'program-plans',
        loadChildren: () =>
          import('program-plan').then((m) => m.programPlanRoutes),
      },
      {
        path: 'media-press',
        loadChildren: () =>
          import('media-press').then((m) => m.mediaPressRoutes),
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
        loadChildren: () =>
          import('pocket-guide').then((m) => m.pocketGuideRoutes),
      },
      {
        path: 'diet-template',
        loadChildren: () =>
          import('diet-template').then((m) => m.dietTemplateRoutes),
      },
      {
        path: 'call-logs',
        loadChildren: () => import('call-logs').then((m) => m.callLogsRoutes),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('appointment').then((m) => m.appointmentRoutes),
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
        path: 'promo-code',
        loadChildren: () => import('promo-code').then((m) => m.promoCodeRoutes),
      },
      {
        path: 'legal-pages',
        loadChildren: () =>
          import('legal-pages').then((m) => m.legalPagesRoutes),
      },
      {
        path: 'seo-page',
        loadChildren: () => import('seo-page').then((m) => m.seoPageRoutes),
      },
      {
        path: 'banners',
        loadChildren: () => import('banners').then((m) => m.bannersRoutes),
      },
      {
        path: 'success-stories',
        loadChildren: () =>
          import('success-stories').then((m) => m.successStoriesRoutes),
      },
      {
        path: 'products',
        loadChildren: () => import('products').then((m) => m.productsRoutes),
      },
      {
        path: 'tax-master',
        loadChildren: () => import('tax-master').then((m) => m.taxMasterRoutes),
      },
      {
        path: 'setting',
        loadChildren: () => import('admin-user').then((m) => m.settingRoutes),
      },
      {
        path: 'change-password',
        loadChildren: () =>
          import('admin-user').then((m) => m.changePasswordRoutes),
      },
      {
        path: 'dashboard',
        loadChildren: () => import('dashboard').then((m) => m.dashboardRoutes),
      },
      {
        path: 'reports',
        loadChildren: () => import('reports').then((m) => m.reportsRoutes),
      },
      {
        path: 'delivery',
        children: [
          {
            path: 'courier-providers',
            loadChildren: () =>
              import('courier-providers').then((m) => m.courierProvidersRoutes),
          },
          {
            path: 'courier-provider-accounts',
            loadChildren: () =>
              import('courier-provider-accounts').then(
                (m) => m.courierProviderAccountsRoutes
              ),
          },
          {
            path: 'warehouses',
            loadChildren: () =>
              import('warehouses').then((m) => m.warehousesRoutes),
          },
          {
            path: 'courier-provider-warehouses',
            loadChildren: () =>
              import('courier-provider-warehouses').then(
                (m) => m.courierProviderWarehousesRoutes
              ),
          },
        ],
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
