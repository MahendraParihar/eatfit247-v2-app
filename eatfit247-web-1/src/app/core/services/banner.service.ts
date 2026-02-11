import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import {
  IMediaUpload,
  IPublicBanner,
  IPublicTableList,
} from '@eatfit247-shared-library/core';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { buildMediaUrl } from '../utils/media-url.util';

/**
 * Slider item model used by banner slider UIs
 */
export interface SliderItem {
  id: string;
  imageUrl: string;
  backgroundImageUrl?: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  shortDescription?: string;
  title?: string;
  titleIcon?: string;
  description?: string;
  primaryActionText?: string;
  primaryActionUrl?: string;
  secondaryActionText?: string;
  secondaryActionUrl?: string;
}

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
  async getBannerSlidesForPage(
    bannerFor: BannerForEnum,
  ): Promise<SliderItem[]> {
    try {
      const data =
        await this.httpService.get<IPublicTableList<IPublicBanner>>(
          'public/banners/list',
          {
            params: {
              bannerFor: bannerFor.toString(),
              limit: '50',
            },
          },
        );

      if (data) {
        return data.tableData.map((banner: IPublicBanner) =>
          this.mapBannerToSliderItem(banner),
        );
      }
      return [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching banners for ${bannerFor}:`, error);
      return [];
    }
  }

  /**
   * Get raw banner media (images) for a specific page.
   * This is used by the shared BannerComponent which expects IMediaUpload[].
   * If no banners or images are available, an empty array is returned.
   */
  async getBannerMediaForPage(
    bannerFor: BannerForEnum,
  ): Promise<IMediaUpload[]> {
    try {
      const data =
        await this.httpService.get<IPublicTableList<IPublicBanner>>(
          'public/banners/list',
          {
            params: {
              bannerFor: bannerFor.toString(),
              limit: '50',
            },
          },
        );

      if (!data || !Array.isArray(data.tableData)) {
        return [];
      }

      // Flatten all imagePath arrays from the banners and filter out invalid entries
      const images: IMediaUpload[] = data.tableData.flatMap(
        (banner: IPublicBanner) =>
          Array.isArray((banner as any).imagePath)
            ? ((banner as any).imagePath as IMediaUpload[])
            : [],
      );

      return images;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching banner media for ${bannerFor}:`, error);
      return [];
    }
  }

  /**
   * Map IPublicBanner to SliderItem
   */
  private mapBannerToSliderItem(banner: IPublicBanner): SliderItem {
    const firstImage =
      banner.imagePath && banner.imagePath.length > 0
        ? banner.imagePath[0]
        : null;

    const imageUrl = buildMediaUrl(firstImage?.webUrl);

    return {
      id: `banner-${banner.bannerId}`,
      imageUrl,
      backgroundImageUrl: imageUrl,
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


