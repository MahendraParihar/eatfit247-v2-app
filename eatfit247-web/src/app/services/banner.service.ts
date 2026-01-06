import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { SliderItem } from '../ui/shared/image-slider/image-slider.component';

interface IBanner {
  bannerId: number;
  id: number;
  title: string;
  subTitle?: string;
  imagePath: Array<{ url?: string; path?: string; [key: string]: any }>;
  active: boolean;
  bannerFor: string;
  imagePosition?: string;
  titleIcon?: string;
  description?: string;
  primaryActionText?: string;
  primaryActionUrl?: string;
  secondaryActionText?: string;
  secondaryActionUrl?: string;
  isInternalUrl?: boolean;
}

interface ITableList<T> {
  tableData: T[];
  count: number;
}

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
    const url = `${this.apiUrl}/public/banners/list`;
    return this.http.get<ITableList<IBanner>>(url, {
      params: {
        bannerFor: 'HOME', // Filter for home page banners
        limit: '50', // Get all banners
      },
    }).pipe(
      map((response) => {
        return response.tableData.map((banner) => this.mapBannerToSliderItem(banner));
      }),
      catchError((error) => {
        console.error('Error fetching banners:', error);
        // Return empty array on error
        return of([]);
      }),
    );
  }

  /**
   * Map IBanner to SliderItem
   */
  private mapBannerToSliderItem(banner: IBanner): SliderItem {
    // Get the first image from imagePath array
    const firstImage = banner.imagePath && banner.imagePath.length > 0
      ? banner.imagePath[0]
      : null;
    const imageUrl = firstImage?.url || firstImage?.path || '';

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

