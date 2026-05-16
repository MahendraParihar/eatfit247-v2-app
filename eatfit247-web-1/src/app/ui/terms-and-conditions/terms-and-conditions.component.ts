import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IPublicLegalPage } from '@eatfit247-shared-library';
import { LegalPagesService } from '../../core/services/legal-pages.service';
import { BreadcrumbsComponent, LoaderComponent } from '@shared-ui';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, BreadcrumbsComponent],
  templateUrl: './terms-and-conditions.component.html',
  styleUrl: './terms-and-conditions.component.scss'
})
export class TermsAndConditionsComponent implements OnInit {
  private readonly legalPagesService = inject(LegalPagesService);
  private readonly router = inject(Router);
  pageData: IPublicLegalPage | null = null;
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadPage();
  }

  private async loadPage(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      // Use the current route path (without leading slash) as the URL slug
      const currentPath = this.router.url.split('?')[0].replace(/^\/+/, '');
      const data = await this.legalPagesService.getByUrl(currentPath || 'terms-and-conditions');
      if (data) {
        this.pageData = data;
      } else {
        this.errorMessage.set('Content is not available at the moment.');
      }
    } catch (_error) {
      this.errorMessage.set('Failed to load content. Please try again later.');
    } finally {
      this.isLoading.set(false);
    }
  }
}


