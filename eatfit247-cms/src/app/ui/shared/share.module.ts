import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { InputErrorComponent } from './components/input-error/input-error.component';
import { AddressSelectorComponent } from './components/address-selector/address-selector.component';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { FileSelectorComponent } from './components/file-selector/file-selector.component';
import { ImageDragDirective } from './directive/image-drag.directive';
import { UserSelectorComponent } from './components/user-selector/user-selector.component';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { AdminShortInfoComponent } from './components/admin-short-info/admin-short-info.component';
import { NoDataFoundComponent } from './components/no-data-found/no-data-found.component';
import { StatusButtonDirective } from './directive/status-button.directive';
import { DateTimePipe } from './pipe/date-time.pipe';
import { CreatedByUserPipe } from './pipe/created-by-user.pipe';
import { UserStatusButtonDirective } from './directive/user-status-button.directive';
import { CustomImgTagComponent } from './components/custom-img-tag/custom-img-tag.component';
import { RecipeSelectorComponent } from './components/recipe-selector/recipe-selector.component';
import { DietDetailsSelectorComponent } from './components/diet-details-selector/diet-details-selector.component';
import { AddressPipe } from './pipe/address.pipe';
import { TriStatusButtonDirective } from './directive/tri-status-button.directive';

@NgModule({
  declarations: [
    AddressSelectorComponent,
    InputErrorComponent,
    FileSelectorComponent,
    ImageDragDirective,
    StatusButtonDirective,
    TriStatusButtonDirective,
    UserStatusButtonDirective,
    UserSelectorComponent,
    SearchFormComponent,
    AdminShortInfoComponent,
    NoDataFoundComponent,
    DateTimePipe,
    AddressPipe,
    CreatedByUserPipe,
    CustomImgTagComponent,
    RecipeSelectorComponent,
    DietDetailsSelectorComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    MaterialModule,
    AngularEditorModule,
  ],
  exports: [
    AddressSelectorComponent,
    InputErrorComponent,
    FileSelectorComponent,
    CustomImgTagComponent,
    ImageDragDirective,
    StatusButtonDirective,
    UserStatusButtonDirective,
    UserSelectorComponent,
    SearchFormComponent,
    AdminShortInfoComponent,
    NoDataFoundComponent,
    FlexLayoutModule,
    AddressPipe,
    DateTimePipe,
    TriStatusButtonDirective,
    CreatedByUserPipe,
    CurrencyPipe,
    RecipeSelectorComponent,
    DietDetailsSelectorComponent,
  ],
  entryComponents: [],
})
export class ShareModule {
}
