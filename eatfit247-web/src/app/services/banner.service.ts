import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { SliderItem } from '../ui/shared/image-slider/image-slider.component';
import { IPublicBanner, IPublicTableList, BannerForEnum } from 'eatfit247-shared-library';

/**
 * Service to manage banner/slider data
 * Fetches banner data from the public API
 */
@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get banner slides for homepage
   * Fetches active banners from the API
   */
  getBannerSlides(): Observable<SliderItem[]> {
    return this.getBannerSlidesForPage(BannerForEnum.HOME);
  }

  /**
   * Get banner slides for a specific page
   * @param bannerFor - The page type to fetch banners for
   * @returns Observable of SliderItem array
   */
  getBannerSlidesForPage(bannerFor: BannerForEnum): Observable<SliderItem[]> {
    const url = `${this.apiUrl}/public/banners/list`;
    return this.http.get<IPublicTableList<IPublicBanner>>(url, {
      params: {
        bannerFor: bannerFor,
        limit: '50', // Get all banners
      },
    }).pipe(
      map((response) => {
        return response.tableData.map((banner: IPublicBanner) => this.mapBannerToSliderItem(banner));
      }),
      catchError((error) => {
        console.error(`Error fetching banners for ${bannerFor}:`, error);
        // Return empty array on error
        return of([]);
      }),
    );
  }

  /**
   * Map IPublicBanner to SliderItem
   */
  private mapBannerToSliderItem(banner: IPublicBanner): SliderItem {
    // Get the first image from imagePath array
    const firstImage = banner.imagePath && banner.imagePath.length > 0
      ? banner.imagePath[0]
      : null;
    const imageUrl = firstImage?.webUrl || '';

    return {
      id: `banner-${banner.bannerId}`,
      imageUrl: imageUrl,
      backgroundImageUrl: imageUrl, // Use same image as background
      imageAlt: banner.title,
      imagePosition: (banner.imagePosition as 'left' | 'right') || 'left',
      shortDescription: banner.subTitle || '',
      title: banner.title,
      titleIcon: banner.titleIcon || '',
      description: banner.description || '',
      primaryActionText: banner.primaryActionText,
      primaryActionUrl: banner.primaryActionUrl,
      secondaryActionText: banner.secondaryActionText,
      secondaryActionUrl: banner.secondaryActionUrl,
    };
  }
}

