import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BaseLayoutComponent } from './layout/base-layout/base-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BaseLayoutComponent],
  template: `<app-base-layout />`,
  styleUrl: './app.scss',
})
export class App {
  protected title = 'eatfit247-web-1';

  private readonly document = inject(DOCUMENT);

  constructor() {
    // Default the application to the light theme. Switch between
    // `light-theme` and `dark-theme` on `document.body` to toggle.
    this.document.body.classList.add('light-theme');
  }
}
