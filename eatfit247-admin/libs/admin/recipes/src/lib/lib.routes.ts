import { Route } from '@angular/router';
import { Recipes } from './recipes/recipes.component';

export const recipesRoutes: Route[] = [{ path: '', component: Recipes, title: 'Recipes' }];
