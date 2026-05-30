import { Route } from '@angular/router';
import { PublicShellComponent } from './ui/public-shell/public-shell.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./ui/home/home.component').then((m) => m.HomeComponent),
        title: 'EatFit247 | Home',
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./ui/about/about-eatfit/about-eatfit.component').then(
            (m) => m.AboutEatfitComponent,
          ),
        title: 'About EatFit247 | Holistic Nutrition & Wellness',
      },
      {
        path: 'about-shweta-shah',
        loadComponent: () =>
          import(
            './ui/about/about-shweta-shah/about-shweta-shah.component'
          ).then((m) => m.AboutShwetaShahComponent),
        title: 'About Shweta Shah | EatFit247',
      },
      {
        path: 'our-programs',
        loadComponent: () =>
          import('./ui/our-programs/our-programs.component').then(
            (m) => m.OurProgramsComponent,
          ),
        title: 'Programs | EatFit247',
      },
      {
        path: 'our-programs/about-shweta-shah-nutritionist',
        loadComponent: () =>
          import(
            './ui/about/about-shweta-shah-nutritionist/about-shweta-shah-nutritionist.component'
          ).then((m) => m.AboutShwetaShahNutritionistComponent),
        title: 'About Shweta Shah — Chief Nutritionist | EatFit247',
      },
      {
        path: 'our-programs/about-chief-nutritionist',
        loadComponent: () =>
          import(
            './ui/about/about-chief-nutritionist/about-chief-nutritionist.component'
          ).then((m) => m.AboutChiefNutritionistComponent),
        title: 'About Birangi Shah — Chief Nutritionist | EatFit247',
      },
      {
        path: 'seasonal-plans',
        loadComponent: () =>
          import('./ui/seasonal-plans/seasonal-plans.component').then(
            (m) => m.SeasonalPlansComponent,
          ),
        title: 'Seasonal & Group Plans | EatFit247',
      },
      {
        path: 'book-session',
        loadComponent: () =>
          import('./ui/book-session/book-session.component').then(
            (m) => m.BookSessionComponent,
          ),
        title: 'Reserve your spot | EatFit247',
      },
      {
        path: 'success-stories',
        loadComponent: () =>
          import('./ui/success-stories/success-stories.component').then(
            (m) => m.SuccessStoriesComponent,
          ),
        title: 'Success stories | EatFit247',
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./ui/blog/blog.component').then((m) => m.BlogComponent),
        title: 'Blog | EatFit247',
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('./ui/blog-detail/blog-detail.component').then(
            (m) => m.BlogDetailsComponent,
          ),
        title: 'Blog details | EatFit247',
      },
      {
        path: 'press-and-media',
        loadComponent: () =>
          import('./ui/press-and-media/press-and-media.component').then(
            (m) => m.PressAndMediaComponent,
          ),
        title: 'Press & media | EatFit247',
      },
      {
        path: 'product',
        loadComponent: () =>
          import('./ui/product/product.component').then(
            (m) => m.ProductComponent,
          ),
        title: 'Product | EatFit247',
      },
      {
        path: 'product/:slug',
        loadComponent: () =>
          import('./ui/product/product.component').then(
            (m) => m.ProductComponent,
          ),
        title: 'Product | EatFit247',
      },
      {
        path: 'know-your-body-dosha',
        loadComponent: () =>
          import(
            './ui/quiz/know-your-body-dosha/know-your-body-dosha.component'
          ).then((m) => m.KnowYourBodyDoshaComponent),
        title: 'Know your body dosha | EatFit247',
      },
      {
        path: 'know-your-current-immunity-score',
        loadComponent: () =>
          import(
            './ui/quiz/know-your-current-immunity-score/know-your-current-immunity-score.component'
          ).then((m) => m.KnowYourCurrentImmunityScoreComponent),
        title: 'Know your current immunity score | EatFit247',
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./ui/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
        title: 'Checkout | EatFit247',
      },
      {
        path: 'checkout/success',
        loadComponent: () =>
          import('./ui/checkout-success/checkout-success.component').then(
            (m) => m.CheckoutSuccessComponent,
          ),
        title: 'Order successful | EatFit247',
      },
      {
        path: 'contact-us',
        loadComponent: () =>
          import('./ui/contact-us/contact-us.component').then(
            (m) => m.ContactUsComponent,
          ),
        title: 'Contact us | EatFit247',
      },
      {
        path: 'faq',
        loadComponent: () =>
          import('./ui/faq/faq.component').then((m) => m.FaqComponent),
        title: 'Frequently asked questions | EatFit247',
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () =>
          import(
            './ui/terms-and-conditions/terms-and-conditions.component'
          ).then((m) => m.TermsAndConditionsComponent),
        title: 'Terms & Conditions | EatFit247',
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./ui/privacy-policy/privacy-policy.component').then(
            (m) => m.PrivacyPolicyComponent,
          ),
        title: 'Privacy Policy | EatFit247',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./ui/not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
        title: 'Page not found | EatFit247',
      },
    ],
  },
];
