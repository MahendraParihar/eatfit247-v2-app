import { Route } from '@angular/router';
import { GoogleReviews } from './google-reviews.component';
import { ManageGoogleReview } from './manage/manage-google-review.component';

export const googleReviewsRoutes: Route[] = [
  { path: '', component: GoogleReviews, title: 'Google Reviews' },
  { path: 'new', component: ManageGoogleReview, title: 'Create Google Review' },
  { path: 'edit/:id', component: ManageGoogleReview, title: 'Edit Google Review' },
];
