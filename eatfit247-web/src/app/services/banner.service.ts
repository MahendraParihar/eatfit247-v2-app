import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
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
  private readonly httpService = inject(HttpService);

  /**
   * Get banner slides for homepage
   * Fetches active banners from the API
   */
  async getBannerSlides(): Promise<SliderItem[]> {
    return this.getBannerSlidesForPage(BannerForEnum.HOME);
  }

  /**
   * Get banner slides for a specific page
   * @param bannerFor - The page type to fetch banners for
   * @returns Promise of SliderItem array
   */
  async getBannerSlidesForPage(bannerFor: BannerForEnum): Promise<SliderItem[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicBanner>>(
        'public/banners/list',
        {
          bannerFor: bannerFor.toString(),
          limit: '50', // Get all banners
        }
      );

      if (data) {
        return data.tableData.map((banner: IPublicBanner) => this.mapBannerToSliderItem(banner));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching banners for ${bannerFor}:`, error);
      return [];
    }
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

