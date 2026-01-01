import { Route } from '@angular/router';
import { PromoCode } from './promo-code.component';
import { ManagePromoCode } from './manage/manage-promo-code.component';

export const promoCodeRoutes: Route[] = [
  { path: '', component: PromoCode, title: 'Promo Codes' },
  { path: 'new', component: ManagePromoCode, title: 'Create Promo Code' },
  { path: 'edit/:id', component: ManagePromoCode, title: 'Edit Promo Code' }
];

