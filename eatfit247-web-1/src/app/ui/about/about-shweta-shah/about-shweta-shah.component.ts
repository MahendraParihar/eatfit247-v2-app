import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { BannerComponent, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner, IPublicLegalPage } from '@eatfit247-shared-library/core';
import { LegalPagesService } from '../../../core/services/legal-pages.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-about-shweta-shah',
  imports: [CommonModule, BannerComponent, LoaderComponent],
  templateUrl: './about-shweta-shah.component.html',
  styleUrl: './about-shweta-shah.component.scss'
})
export class AboutShwetaShahComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly legalPagesService = inject(LegalPagesService);
  private readonly router = inject(Router);
  pageData: IPublicLegalPage | null = null;
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  banners: IPublicBanner[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
    await this.loadPage();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.ABOUT_SHWETA
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for About Shweta Shah page:',
        error
      );
      this.banners = [];
    }
  }

  private async loadPage(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      // Use current route path (without leading slash) as the URL slug
      const currentPath = this.router.url.split('?')[0].replace(/^\/+/, '');
      const data = await this.legalPagesService.getByUrl(
        currentPath || 'about-shweta-shah'
      );
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


