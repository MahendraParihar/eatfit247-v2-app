import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IPublicLegalPage } from '@eatfit247-shared-library/core';
import { LegalPagesService } from '../../core/services/legal-pages.service';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-and-conditions.component.html',
  styleUrl: './terms-and-conditions.component.scss'
})
export class TermsAndConditionsComponent implements OnInit {
  private readonly legalPagesService = inject(LegalPagesService);
  private readonly router = inject(Router);

  readonly lastUpdated = 'February 2026';

  pageData: IPublicLegalPage | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadPage();
  }

  private async loadPage(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      // Use current route path (without leading slash) as the URL slug
      const currentPath = this.router.url.split('?')[0].replace(/^\/+/, '');
      const data = await this.legalPagesService.getByUrl(currentPath || 'terms-and-conditions');

      if (data) {
        this.pageData = data;
      } else {
        this.errorMessage = 'Content is not available at the moment.';
      }
    } catch (_error) {
      this.errorMessage = 'Failed to load content. Please try again later.';
    } finally {
      this.isLoading = false;
    }
  }
}


