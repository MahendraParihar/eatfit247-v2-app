/**
 * API Base Service
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Base service for API services - provides common functionality
 * Uses HttpService for all HTTP operations
 */

import { Injectable } from '@angular/core';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class ApiBaseService {
  protected apiUrl: string;
  protected httpService: HttpService;

  constructor(httpService: HttpService) {
    this.httpService = httpService;
    this.apiUrl = httpService.getBaseUrl();
  }

  /**
   * Build query parameters (kept for backward compatibility)
   * @deprecated Use HttpService.get() with options.params instead
   */
  protected buildParams(params?: any): any {
    return params;
  }
}

