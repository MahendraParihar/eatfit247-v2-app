import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../../../../../../src/app/layout/header/site-header.component';
import { SiteFooterComponent } from '../../../../../../src/app/layout/footer/site-footer.component';
import { ContainerComponent } from '../container/container.component';

@Component({
  standalone: true,
  selector: 'app-public-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    SiteHeaderComponent,
    SiteFooterComponent,
    ContainerComponent,
  ],
  template: `
    <header>
      <app-site-header></app-site-header>
    </header>
    <main role="main">
      <app-container>
        <router-outlet></router-outlet>
      </app-container>
    </main>
    <footer>
      <app-site-footer></app-site-footer>
    </footer>
  `,
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {}

