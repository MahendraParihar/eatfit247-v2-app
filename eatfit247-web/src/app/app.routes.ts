import { Routes } from '@angular/router';
import { trailingSlashGuard } from './guards/trailing-slash.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ui/home/home.component').then(m => m.HomeComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'about-us',
    loadComponent: () => import('./ui/about/about-eatfit/about-eatfit.component').then(m => m.AboutEatfitComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'about-shweta-shah',
    loadComponent: () => import('./ui/about/about-shweta-shah/about-shweta-shah.component').then(m => m.AboutShwetaShahComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'our-programs',
    loadComponent: () => import('./ui/our-programs/our-programs.component').then(m => m.OurProgramsComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'our-programs/:id',
    loadComponent: () => import('./ui/program-details/program-details.component').then(m => m.ProgramDetailsComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'product',
    loadComponent: () => import('./ui/product/product.component').then(m => m.ProductComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'product/:slug',
    loadComponent: () => import('./ui/product/product.component').then(m => m.ProductComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'know-your-body-dosha',
    loadComponent: () => import('./ui/quiz/know-your-body-dosha/know-your-body-dosha.component').then(m => m.KnowYourBodyDoshaComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'know-your-current-immunity-score',
    loadComponent: () => import('./ui/quiz/know-your-current-immunity-score/know-your-current-immunity-score.component').then(m => m.KnowYourCurrentImmunityScoreComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'press-and-media',
    loadComponent: () => import('./ui/press-and-media/press-and-media.component').then(m => m.PressAndMediaComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'success-stories',
    loadComponent: () => import('./ui/success-stories/success-stories.component').then(m => m.SuccessStoriesComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'blog',
    loadComponent: () => import('./ui/blog/blog.component').then(m => m.BlogComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./ui/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./ui/contact-us/contact-us.component').then(m => m.ContactUsComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'faq',
    loadComponent: () => import('./ui/faq/faq.component').then(m => m.FaqComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'checkout',
    loadComponent: () => import('./ui/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: 'checkout/success',
    loadComponent: () => import('./ui/checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent),
    canActivate: [trailingSlashGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./ui/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
