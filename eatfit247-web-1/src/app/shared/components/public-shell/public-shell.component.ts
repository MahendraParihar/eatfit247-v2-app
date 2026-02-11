import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../../../layout/header/site-header.component';
import { SiteFooterComponent } from '../../../layout/footer/site-footer.component';
import { ContainerComponent } from '../container/container.component';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, ContainerComponent],
  template: `
    <header>
      <app-site-header />
    </header>
    <main>
      <app-container>
        <router-outlet />
      </app-container>
    </main>
    <footer>
      <app-site-footer />
    </footer>
  `,
  styleUrl: './public-shell.component.scss',
})
export class PublicShellComponent {}

