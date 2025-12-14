import { Route } from '@angular/router';
import { Recipes } from './recipes/recipes';

export const recipesRoutes: Route[] = [{ path: '', component: Recipes, title: 'Recipes' }];
