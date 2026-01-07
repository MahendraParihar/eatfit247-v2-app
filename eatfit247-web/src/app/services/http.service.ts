import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { IResponse } from 'eatfit247-shared-library';

/**
 * Centralized HTTP Service
 * 
 * Provides a single point of access for all HTTP operations with:
 * - Consistent IResponse<T> handling
 * - Async/await support
 * - Centralized error handling
 * - Automatic API URL prefixing
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * GET request
   * @param endpoint - API endpoint (without base URL)
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with response data
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    headers?: HttpHeaders
  ): Promise<T | null> {
    try {
      const url = this.buildUrl(endpoint);
      const httpParams = this.buildParams(params);
      
      const response = await firstValueFrom(
        this.http.get<IResponse<T>>(url, {
          params: httpParams,
          headers: headers,
        })
      );

      return response.data ?? null;
    } catch (error) {
      console.error(`Error in GET ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with response data
   */
  async post<T>(
    endpoint: string,
    body: any,
    params?: Record<string, string | number | boolean>,
    headers?: HttpHeaders
  ): Promise<T | null> {
    try {
      const url = this.buildUrl(endpoint);
      const httpParams = this.buildParams(params);

      const response = await firstValueFrom(
        this.http.post<IResponse<T>>(url, body, {
          params: httpParams,
          headers: headers,
        })
      );

      return response.data ?? null;
    } catch (error) {
      console.error(`Error in POST ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with response data
   */
  async put<T>(
    endpoint: string,
    body: any,
    params?: Record<string, string | number | boolean>,
    headers?: HttpHeaders
  ): Promise<T | null> {
    try {
      const url = this.buildUrl(endpoint);
      const httpParams = this.buildParams(params);

      const response = await firstValueFrom(
        this.http.put<IResponse<T>>(url, body, {
          params: httpParams,
          headers: headers,
        })
      );

      return response.data ?? null;
    } catch (error) {
      console.error(`Error in PUT ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with response data
   */
  async patch<T>(
    endpoint: string,
    body: any,
    params?: Record<string, string | number | boolean>,
    headers?: HttpHeaders
  ): Promise<T | null> {
    try {
      const url = this.buildUrl(endpoint);
      const httpParams = this.buildParams(params);

      const response = await firstValueFrom(
        this.http.patch<IResponse<T>>(url, body, {
          params: httpParams,
          headers: headers,
        })
      );

      return response.data ?? null;
    } catch (error) {
      console.error(`Error in PATCH ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint (without base URL)
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with response data
   */
  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    headers?: HttpHeaders
  ): Promise<T | null> {
    try {
      const url = this.buildUrl(endpoint);
      const httpParams = this.buildParams(params);

      const response = await firstValueFrom(
        this.http.delete<IResponse<T>>(url, {
          params: httpParams,
          headers: headers,
        })
      );

      return response.data ?? null;
    } catch (error) {
      console.error(`Error in DELETE ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Build full URL from endpoint
   * @param endpoint - API endpoint
   * @returns Full URL
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Remove trailing slash from apiUrl if present
    const cleanApiUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    return `${cleanApiUrl}/${cleanEndpoint}`;
  }

  /**
   * Build HttpParams from record
   * @param params - Query parameters
   * @returns HttpParams instance
   */
  private buildParams(params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return httpParams;
  }

  /**
   * Handle HTTP errors
   * @param error - Error object
   * @returns Formatted error
   */
  private handleError(error: any): Error {
    if (error.error) {
      return new Error(error.error.message || error.message || 'An error occurred');
    }
    return new Error(error.message || 'An error occurred');
  }
}

