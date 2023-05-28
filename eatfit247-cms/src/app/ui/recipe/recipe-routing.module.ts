import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guard/auth-guard';
import { RecipeListComponent } from './recipe-list/recipe-list.component';
import { RecipeManageComponent } from './recipe-manage/recipe-manage.component';

const routes: Routes = [
  {
    path: 'recipe-list',
    canActivate: [AuthGuard],
    component: RecipeListComponent,
  },
  {
    path: 'recipe-manage',
    canActivate: [AuthGuard],
    component: RecipeManageComponent,
  },
  {
    path: 'recipe-manage/:id',
    canActivate: [AuthGuard],
    component: RecipeManageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipeRoutingModule {
}
