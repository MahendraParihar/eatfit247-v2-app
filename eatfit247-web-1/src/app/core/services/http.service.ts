import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IResponse } from '@eatfit247-shared-library/core';

/**
 * HTTP Options interface for configuring requests
 */
export interface HttpOptions {
  params?: Record<string, string | number | boolean | string[]>;
  headers?: HttpHeaders | { [header: string]: string | string[] };
  observe?: 'body' | 'events' | 'response';
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
}

/**
 * HTTP Service
 *
 * Centralized HTTP service for all server communications.
 * Provides GET, POST, PUT, PATCH, DELETE methods with consistent error handling.
 *
 * @example
 * ```typescript
 * // In a component or service
 * constructor(private httpService: HttpService) {}
 *
 * async loadData() {
 *   try {
 *     const data = await this.httpService.get<User[]>('/api/users');
 *     console.log(data);
 *   } catch (error) {
 *     console.error('Failed to load data:', error);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly http = inject(HttpClient);
  private baseUrl = '';

  /**
   * Set the base URL for all API requests
   * @param url Base URL (e.g., 'https://api.example.com' or '/api')
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Build HttpParams from object
   */
  private buildParams(
    params?: Record<string, string | number | boolean | string[]>
  ): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          // Handle arrays
          if (Array.isArray(value)) {
            value.forEach((item) => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    return httpParams;
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.substring(1)
      : endpoint;

    if (!this.baseUrl) {
      return `/${cleanEndpoint}`;
    }

    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build request options
   */
  private buildRequestOptions(options?: HttpOptions): any {
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false,
    };

    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }

    // Only set observe if explicitly provided and not 'body' (default)
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }

    return requestOptions;
  }

  /**
   * Extract data from IResponse<T> format
   * If the response is already in IResponse format, extract the data property
   * Otherwise, return the response as-is (for backward compatibility)
   */
  private extractData<T>(response: IResponse<T> | T, options?: HttpOptions): T | null {
    // If observe is not 'body', return response as-is (it's an event or full response)
    if (options?.observe && options.observe !== 'body') {
      return response as unknown as T | null;
    }

    // Check if response is in IResponse format
    if (
      response &&
      typeof response === 'object' &&
      'data' in response
    ) {
      const iResponse = response as IResponse<T>;
      return iResponse.data ?? null;
    }
    // Return as-is if not in IResponse format
    return response as unknown as T;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): never {
    let errorMessage = 'An unknown error occurred';

    // Guard against environments where ErrorEvent is not defined (e.g. SSR/Node)
    if (
      typeof ErrorEvent !== 'undefined' &&
      error.error instanceof ErrorEvent
    ) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error - check if it's in IResponse format
      if (
        error.error &&
        typeof error.error === 'object' &&
        'code' in error.error &&
        'message' in error.error
      ) {
        const iResponse = error.error as IResponse<unknown>;
        errorMessage = iResponse.message || error.message;
      } else {
        errorMessage =
          error.error?.message ||
          error.message ||
          `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    const errorResponse = {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      error: error.error,
    };

    console.error('HTTP Error:', errorResponse);
    throw errorResponse;
  }

  /**
   * GET request
   * @param endpoint API endpoint (e.g., '/users' or 'users')
   * @param options Optional HTTP options (params, headers, etc.)
   * @returns Promise with response data
   *
   * @example
   * ```typescript
   * // Simple GET
   * const users = await httpService.get<User[]>('/api/users');
   *
   * // GET with query parameters
   * const users = await httpService.get<User[]>('/api/users', {
   *   params: { page: 1, limit: 10 }
   * });
   * ```
   */
  async get<T>(endpoint: string, options?: HttpOptions): Promise<T | null> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      // If observe is not 'body', use the generic type directly
      if (options?.observe && options.observe !== 'body') {
        const result = await firstValueFrom(
          this.http.get<T>(url, requestOptions)
        );
        return result as unknown as T | null;
      }
      const result = await firstValueFrom(
        this.http.get<IResponse<T>>(url, requestOptions)
      );
      return this.extractData(result, options) as T | null;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * POST request
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Optional HTTP options
   * @returns Promise with response data
   *
   * @example
   * ```typescript
   * const newUser = await httpService.post<User>('/api/users', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: HttpOptions
  ): Promise<T | null> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      // If observe is not 'body', use the generic type directly
      if (options?.observe && options.observe !== 'body') {
        const result = await firstValueFrom(
          this.http.post<T>(url, body, requestOptions)
        );
        return result as unknown as T | null;
      }
      const result = await firstValueFrom(
        this.http.post<IResponse<T>>(url, body, requestOptions)
      );
      return this.extractData(result, options) as T | null;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * PUT request
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Optional HTTP options
   * @returns Promise with response data
   *
   * @example
   * ```typescript
   * const updatedUser = await httpService.put<User>('/api/users/1', {
   *   name: 'Jane Doe'
   * });
   * ```
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: HttpOptions
  ): Promise<T | null> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      // If observe is not 'body', use the generic type directly
      if (options?.observe && options.observe !== 'body') {
        const result = await firstValueFrom(
          this.http.put<T>(url, body, requestOptions)
        );
        return result as unknown as T | null;
      }
      const result = await firstValueFrom(
        this.http.put<IResponse<T>>(url, body, requestOptions)
      );
      return this.extractData(result, options) as T | null;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * PATCH request
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Optional HTTP options
   * @returns Promise with response data
   *
   * @example
   * ```typescript
   * const patchedUser = await httpService.patch<User>('/api/users/1', {
   *   email: 'newemail@example.com'
   * });
   * ```
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: HttpOptions
  ): Promise<T | null> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      // If observe is not 'body', use the generic type directly
      if (options?.observe && options.observe !== 'body') {
        const result = await firstValueFrom(
          this.http.patch<T>(url, body, requestOptions)
        );
        return result as unknown as T | null;
      }
      const result = await firstValueFrom(
        this.http.patch<IResponse<T>>(url, body, requestOptions)
      );
      return this.extractData(result, options) as T | null;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * DELETE request
   * @param endpoint API endpoint
   * @param options Optional HTTP options
   * @returns Promise with response data
   *
   * @example
   * ```typescript
   * await httpService.delete('/api/users/1');
   * ```
   */
  async delete<T>(endpoint: string, options?: HttpOptions): Promise<T | null> {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);

    try {
      // If observe is not 'body', use the generic type directly
      if (options?.observe && options.observe !== 'body') {
        const result = await firstValueFrom(
          this.http.delete<T>(url, requestOptions)
        );
        return result as unknown as T | null;
      }
      const result = await firstValueFrom(
        this.http.delete<IResponse<T>>(url, requestOptions)
      );
      return this.extractData(result, options) as T | null;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   * @param endpoint API endpoint
   * @param formData FormData containing the file
   * @param options Optional HTTP options
   * @returns Observable for tracking upload progress
   *
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('file', file);
   *
   * httpService.uploadFile('/api/upload', formData).subscribe({
   *   next: (event) => {
   *     // Handle progress
   *   },
   *   error: (error) => {
   *     // Handle error
   *   }
   * });
   * ```
   */
  uploadFile(
    endpoint: string,
    formData: FormData,
    options?: Omit<HttpOptions, 'observe' | 'reportProgress'>
  ): Observable<any> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: true,
      observe: 'events',
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false,
    };

    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }

    return this.http.post(url, formData, requestOptions);
  }

  /**
   * Download file as blob
   * @param endpoint API endpoint
   * @param body Optional request body
   * @param options Optional HTTP options
   * @returns Promise with Blob data
   *
   * @example
   * ```typescript
   * const blob = await httpService.downloadFile('/api/export', { format: 'pdf' });
   * const url = window.URL.createObjectURL(blob);
   * const link = document.createElement('a');
   * link.href = url;
   * link.download = 'export.pdf';
   * link.click();
   * ```
   */
  async downloadFile(
    endpoint: string,
    body?: unknown,
    options?: Omit<HttpOptions, 'responseType'>
  ): Promise<Blob> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: 'blob',
      withCredentials: options?.withCredentials || false,
    };

    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }

    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }

    try {
      const result = await firstValueFrom(
        this.http.post(url, body, requestOptions)
      );
      return result as unknown as Blob;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }
}

