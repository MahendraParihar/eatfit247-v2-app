import { Route } from '@angular/router';
import { Products } from './products.component';
import { ManageProduct } from './manage/manage-product.component';

export const productsRoutes: Route[] = [
  { path: '', component: Products, title: 'Products' },
  { path: 'new', component: ManageProduct, title: 'Create Product' },
  { path: 'edit/:id', component: ManageProduct, title: 'Edit Product' }
];

