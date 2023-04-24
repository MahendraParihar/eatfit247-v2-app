import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  DialogSendPushNotificationComponent
} from './ui/shared/components/dialog-send-push-notification/dialog-send-push-notification.component';
import {BaseLayoutComponent} from './ui/base-layout/base-layout.component';
import {MaterialModule} from "./material.module";
import {AuthGuard} from "./guard/auth-guard";
import {SideMenuComponent} from './ui/side-menu/side-menu.component';
import {HomeComponent} from './ui/home/home.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {HttpRequestInterceptor} from './http-request-interceptor';
import {DialogAlertComponent} from './ui/shared/components/dialog-alert/dialog-alert.component';
import {
  ConfigParameterListComponent
} from "./ui/config-parameter/config-parameter-list/config-parameter-list.component";
import {
  ConfigParameterManageComponent
} from "./ui/config-parameter/config-parameter-manage/config-parameter-manage.component";
import {ShareModule} from "./ui/shared/share.module";
import {InfoDialogComponent} from './ui/shared/components/info-dialog/info-dialog.component';
import {PageNotFoundComponent} from "./ui/error-pages/page-not-found/page-not-found.component";
import {MatIconRegistry} from "@angular/material/icon";
import {FlexLayoutModule} from "@angular/flex-layout";
import {
  DialogUserStatusChangeComponent
} from "./ui/shared/components/dialog-user-status-change/dialog-user-status-change.component";

@NgModule({
  declarations: [
    AppComponent,
    DialogSendPushNotificationComponent,
    BaseLayoutComponent,
    SideMenuComponent,
    HomeComponent,
    DialogAlertComponent,
    ConfigParameterListComponent,
    ConfigParameterManageComponent,
    DialogUserStatusChangeComponent,
    InfoDialogComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    ShareModule,
    FlexLayoutModule,
    HttpClientModule
  ],
  exports: [],
  schemas: [
    NO_ERRORS_SCHEMA,
    CUSTOM_ELEMENTS_SCHEMA
  ],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor, multi: true
    },
    /*{
      provide: ErrorHandler,
      useClass: ErrorHandlerService
    }*/
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    DialogAlertComponent,
    InfoDialogComponent,
    DialogUserStatusChangeComponent
  ]
})
export class AppModule {
  constructor(private matIconRegistry: MatIconRegistry) {
    this.matIconRegistry.addSvgIcon("ic_check_circle", "assets/icons/ic_check_circle.svg");
    // iconRegistry.setDefaultFontSetClass('material-icons-outlined');
  }
}
