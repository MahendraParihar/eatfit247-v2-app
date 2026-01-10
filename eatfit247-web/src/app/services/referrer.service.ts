import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicTableList } from 'eatfit247-shared-library';

export interface IPublicReferrer {
  companyName: string;
  logo: string | any[];
}

export interface Partner {
  name: string;
  logo?: string;
  subtext?: string;
  description?: string;
}

/**
 * Service to manage referrer/partner data
 * Fetches referrer data from the public API
 */
@Injectable({
  providedIn: 'root',
})
export class ReferrerService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all active referrers (partners)
   */
  async getPartners(): Promise<Partner[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicReferrer>>(
        'public/referrer/list',
        { limit: '1000' }
      );

      if (data) {
        return data.tableData.map((item: IPublicReferrer) => this.mapReferrerToPartner(item));
      }
      return [];
    } catch (error) {
      console.error('Error fetching referrers/partners:', error);
      return [];
    }
  }

  /**
   * Map IPublicReferrer from API to Partner
   */
  private mapReferrerToPartner(item: IPublicReferrer): Partner {
    // Handle logo - backend returns it as a string URL via buildImageUrl
    // But handle both string and array cases for safety
    let logoUrl: string | undefined;
    
    if (typeof item.logo === 'string') {
      logoUrl = item.logo;
    } else if (Array.isArray(item.logo) && item.logo.length > 0) {
      // If it's an array, get the first item's webUrl or url property
      const firstLogo = item.logo[0];
      if (typeof firstLogo === 'string') {
        logoUrl = firstLogo;
      } else if (firstLogo && typeof firstLogo === 'object') {
        logoUrl = firstLogo.webUrl || firstLogo.url || (firstLogo as any).src;
      }
    }

    return {
      name: item.companyName || 'Partner',
      logo: logoUrl,
      description: undefined, // API doesn't provide description
    };
  }
}

