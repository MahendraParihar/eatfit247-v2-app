import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeRoutingModule } from './recipe-routing.module';
import { RecipeListComponent } from './recipe-list/recipe-list.component';
import { RecipeManageComponent } from './recipe-manage/recipe-manage.component';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ShareModule } from '../shared/share.module';
import { PreviewRecipeDialogComponent } from './preview-recipe-dialog/preview-recipe-dialog.component';

@NgModule({
  declarations: [
    RecipeListComponent,
    RecipeManageComponent,
    PreviewRecipeDialogComponent,
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    CommonModule,
    RecipeRoutingModule,
  ],
  entryComponents: [
    PreviewRecipeDialogComponent,
  ],
})
export class RecipeModule {
}
