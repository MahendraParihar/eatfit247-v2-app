import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';

platformBrowser()
  .bootstrapModule(AppModule, {
    ngZoneEventCoalescing: true,
  })
  .catch((err) => {
    // Log bootstrap errors to console for debugging
    // In production, these should be sent to error tracking service
    if (typeof window !== 'undefined' && window.console) {
      window.console.error('Application bootstrap failed:', err);
    }
  });
