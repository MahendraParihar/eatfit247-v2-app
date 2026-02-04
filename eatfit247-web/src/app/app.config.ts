import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { TrailingSlashUrlSerializer } from './utils/trailing-slash-url-serializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: UrlSerializer,
      useClass: TrailingSlashUrlSerializer,
    },
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
  ]
};
