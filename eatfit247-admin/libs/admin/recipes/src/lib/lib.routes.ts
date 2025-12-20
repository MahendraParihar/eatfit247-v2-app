import { Route } from '@angular/router';
import { Recipes } from './recipes.component';
import { ManageRecipe } from './manage/manage-recipe.component';

export const recipesRoutes: Route[] = [
  { path: '', component: Recipes, title: 'Recipes' },
  { path: 'new', component: ManageRecipe, title: 'Create Recipe' },
  { path: 'edit/:id', component: ManageRecipe, title: 'Edit Recipe' }
];
