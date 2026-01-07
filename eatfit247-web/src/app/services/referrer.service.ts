import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { IPublicTableList } from 'eatfit247-shared-library';

export interface IPublicReferrer {
  companyName: string;
  logo: string | any[];
}

export interface Partner {
  name: string;
  logo?: string;
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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get all active referrers (partners)
   */
  getPartners(): Observable<Partner[]> {
    const params = new HttpParams().set('limit', '1000');
    const url = `${this.apiUrl}/public/referrer/list`;
    return this.http.get<IPublicTableList<IPublicReferrer>>(url, { params }).pipe(
      map((response) => {
        return response.tableData.map((item: IPublicReferrer) => this.mapReferrerToPartner(item));
      }),
      catchError((error) => {
        console.error('Error fetching referrers/partners:', error);
        return of([]);
      }),
    );
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

