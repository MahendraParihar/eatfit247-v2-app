import { Routes } from '@angular/router';
import { HomeComponent } from './ui/home/home.component';
import { AboutEatfitComponent } from './ui/about/about-eatfit/about-eatfit.component';
import { AboutShwetaShahComponent } from './ui/about/about-shweta-shah/about-shweta-shah.component';
import { OurProgramsComponent } from './ui/our-programs/our-programs.component';
import { ProgramDetailsComponent } from './ui/program-details/program-details.component';
import { KnowYourBodyDoshaComponent } from './ui/quiz/know-your-body-dosha/know-your-body-dosha.component';
import { KnowYourCurrentImmunityScoreComponent } from './ui/quiz/know-your-current-immunity-score/know-your-current-immunity-score.component';
import { PressAndMediaComponent } from './ui/press-and-media/press-and-media.component';
import { SuccessStoriesComponent } from './ui/success-stories/success-stories.component';
import { BlogComponent } from './ui/blog/blog.component';
import { BlogDetailComponent } from './ui/blog-detail/blog-detail.component';
import { ContactUsComponent } from './ui/contact-us/contact-us.component';
import { CheckoutComponent } from './ui/checkout/checkout.component';
import { ProductComponent } from './ui/product/product.component';
import { FaqComponent } from './ui/faq/faq.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'about-us',
    component: AboutEatfitComponent,
  },
  {
    path: 'about-shweta-shah',
    component: AboutShwetaShahComponent,
  },
  {
    path: 'our-programs',
    component: OurProgramsComponent,
  },
  {
    path: 'our-programs/:id',
    component: ProgramDetailsComponent,
  },
  {
    path: 'product',
    component: ProductComponent,
  },
  {
    path: 'product/:slug',
    component: ProductComponent,
  },
  {
    path: 'know-your-body-dosha',
    component: KnowYourBodyDoshaComponent,
  },
  {
    path: 'know-your-current-immunity-score',
    component: KnowYourCurrentImmunityScoreComponent,
  },
  {
    path: 'press-and-media',
    component: PressAndMediaComponent,
  },
  {
    path: 'success-stories',
    component: SuccessStoriesComponent,
  },
  {
    path: 'blog',
    component: BlogComponent,
  },
  {
    path: 'blog/:slug',
    component: BlogDetailComponent,
  },
  {
    path: 'contact-us',
    component: ContactUsComponent,
  },
  {
    path: 'faq',
    component: FaqComponent,
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
