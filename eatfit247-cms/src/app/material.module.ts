import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatSelectModule} from "@angular/material/select";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatListModule} from "@angular/material/list";
import {MatMenuModule} from "@angular/material/menu";
import {MatCardModule} from "@angular/material/card";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogModule} from "@angular/material/dialog";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatTableModule} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSortModule} from "@angular/material/sort";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {MatRadioModule} from "@angular/material/radio";
import {AngularEditorModule} from '@kolkov/angular-editor';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule} from "@angular/material-moment-adapter";
import {MAT_DATE_FORMATS} from "@angular/material/core";
import {Constants} from "./constants/Constants";
import {NgxMatTimepickerModule} from "ngx-mat-timepicker";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatChipsModule} from "@angular/material/chips";
import {MatTabsModule} from "@angular/material/tabs";
import {MatStepperModule} from "@angular/material/stepper";
import {MatTreeModule} from "@angular/material/tree";
import {MatBadgeModule} from "@angular/material/badge";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@NgModule({
  imports: [
    MatSidenavModule,
    MatCheckboxModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatCardModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatGridListModule,
    MatButtonToggleModule,
    MatRadioModule,
    AngularEditorModule,
    NgxMatTimepickerModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTabsModule,
    MatStepperModule,
    MatTreeModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  exports: [
    MatSidenavModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatGridListModule,
    MatButtonToggleModule,
    MatRadioModule,
    AngularEditorModule,
    NgxMatTimepickerModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTabsModule,
    MatStepperModule,
    MatTreeModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  providers: [
    {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {}},
    {provide: MAT_DATE_FORMATS, useValue: Constants.APP_DATE_FORMATS}
    /*{
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        floatLabel: 'always',
        appearance: 'outline'
      }
    }*/
  ],
  schemas: [
    NO_ERRORS_SCHEMA,
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class MaterialModule {
}
