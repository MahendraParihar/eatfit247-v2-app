import {NgModule} from '@angular/core';
import {NavigationEnd, Router, RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "./guard/auth-guard";
import {BaseLayoutComponent} from "./ui/base-layout/base-layout.component";
import {HomeComponent} from "./ui/home/home.component";

import {
  ConfigParameterManageComponent
} from "./ui/config-parameter/config-parameter-manage/config-parameter-manage.component";
import {NavigationService} from "./service/navigation.service";
import {NavigationPathEnum} from "./enum/navigation-path-enum";
import {PageNotFoundComponent} from "./ui/error-pages/page-not-found/page-not-found.component";

const routes: Routes = [
  {
    path: 'auth',
    pathMatch: 'prefix',
    loadChildren: () => import('./ui/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    component: BaseLayoutComponent,
    children: [
      {
        path: '',
        canActivate: [AuthGuard],
        component: HomeComponent
      },
      {
        path: 'admin-user',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/admin-user/admin-user.module').then(m => m.AdminUserModule)
      },
      {
        path: 'franchise',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/franchise/franchise.module').then(m => m.FranchiseModule)
      },
      {
        path: 'member',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/member/member.module').then(m => m.MemberModule)
      },
      {
        path: 'recipe',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/recipe/recipe.module').then(m => m.RecipeModule)
      },
      {
        path: 'diet-template',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/diet-template/diet-template.module').then(m => m.DietTemplateModule)
      },
      {
        path: 'blogs',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/blogs/blogs.module').then(m => m.BlogsModule)
      },
      {
        path: 'member-testimonial',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/member-testimonial/member-testimonial.module').then(m => m.MemberTestimonialModule)
      },
      {
        path: 'program-and-plan',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/program-and-plan/program-and-plan.module').then(m => m.ProgramAndPlanModule)
      },
      {
        path: 'referrer',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/referrer/referrer.module').then(m => m.ReferrerModule)
      },
      {
        path: 'report',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/report/report.module').then(m => m.ReportModule)
      },
      {
        path: 'lov',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/lov/lov.module').then(m => m.LovModule)
      },
      {
        path: 'faq',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/faq/faq.module').then(m => m.FaqModule)
      },
      {
        path: 'pocket-guide',
        canActivate: [AuthGuard],
        loadChildren: () => import('./ui/pocket-guide/pocket-guide.module').then(m => m.PocketGuideModule)
      },
      {
        path: 'settings',
        canActivate: [AuthGuard],
        component: ConfigParameterManageComponent
      },
      {
        path: 'config-param-manage',
        canActivate: [AuthGuard],
        component: ConfigParameterManageComponent
      },
      {
        path: 'config-param-manage/:id',
        canActivate: [AuthGuard],
        component: ConfigParameterManageComponent
      }
    ]
  },
  {
    path: '**',
    pathMatch: 'full',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  constructor(private router: Router,
              private navigationService: NavigationService) {
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        if (ev.url) {
          let temp = ev.url;
          if (temp.substring(0, 1) === '/') {
            temp = temp.substring(1, temp.length);
          }
          this.navigationService.setBreadcrumb(<NavigationPathEnum>temp);
        }
      }
    });
  }
}
