import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IResponse } from '@eatfit247-shared-library/core';
import { environment } from '@env';

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

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly baseUrl: string;
  private readonly http = inject(HttpClient);

  constructor() {
    this.baseUrl = environment.apiUrl;
  }

  /**
   * Build HttpParams from object
   */
  private buildParams(params?: any): HttpParams {
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
   * Build request options
   */
  private buildOptions(options?: HttpOptions): any {
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false, // For HttpOnly cookies
    };
    // Only set observe if explicitly provided and not 'body' (default)
    // When observe is 'body' or not set, we don't include it to get proper typing
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }
    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }
    return requestOptions;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): never {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage =
        error.error?.message ||
        error.message ||
        `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    throw {
      status: error.status,
      message: errorMessage,
      error: error.error,
    };
  }

  /**
   * GET request
   * @param endpoint API endpoint (e.g., '/users' or 'users')
   * @param options Optional HTTP options (params, headers, etc.)
   */
  async get<T>(endpoint: string, options?: HttpOptions): Promise<IResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false, // For HttpOnly cookies
    };
    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }
    // Only set observe if explicitly provided and not 'body'
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }
    try {
      const result = await firstValueFrom(
        this.http.get<IResponse<T>>(url, requestOptions)
      );
      return result as IResponse<T>;
    } catch (error: any) {
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
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options?: HttpOptions
  ): Promise<IResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false, // For HttpOnly cookies
    };
    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }
    try {
      const result = await firstValueFrom(
        this.http.post<IResponse<T>>(url, body, requestOptions)
      );
      return result as IResponse<T>;
    } catch (error: any) {
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
   */
  async put<T>(
    endpoint: string,
    body?: any,
    options?: HttpOptions
  ): Promise<IResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false, // For HttpOnly cookies
    };
    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }
    try {
      const result = await firstValueFrom(
        this.http.put<IResponse<T>>(url, body, requestOptions)
      );
      return result as IResponse<T>;
    } catch (error: any) {
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
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    options?: HttpOptions
  ): Promise<IResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false, // For HttpOnly cookies
    };
    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }
    try {
      const result = await firstValueFrom(
        this.http.patch<IResponse<T>>(url, body, requestOptions)
      );
      return result as IResponse<T>;
    } catch (error: any) {
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
   */
  async delete<T>(
    endpoint: string,
    options?: HttpOptions
  ): Promise<IResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions: any = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: options?.responseType || 'json',
      withCredentials: options?.withCredentials || false, // For HttpOnly cookies
    };
    if (options?.params) {
      requestOptions.params = this.buildParams(options.params);
    }
    if (options?.observe && options.observe !== 'body') {
      requestOptions.observe = options.observe;
    }
    try {
      const result = await firstValueFrom(
        this.http.delete<IResponse<T>>(url, requestOptions)
      );
      return result as IResponse<T>;
    } catch (error: any) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  public uploadMedia(url: string, formData: FormData): Observable<any> {
    return this.http.post(this.buildUrl(url), formData, {
      reportProgress: true,
      observe: 'events',
      withCredentials: true, // For HttpOnly cookies
    });
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.substring(1)
      : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * POST request for blob downloads (file exports)
   * @param endpoint API endpoint
   * @param body Request body
   * @param options Optional HTTP options
   * @returns Promise<Blob> - The blob file data
   */
  async postBlob(
    endpoint: string,
    body?: unknown,
    options?: Omit<HttpOptions, 'responseType'>
  ): Promise<Blob> {
    const url = this.buildUrl(endpoint);
    const requestOptions = {
      headers: options?.headers,
      reportProgress: options?.reportProgress || false,
      responseType: 'blob' as const,
      withCredentials: options?.withCredentials ?? true, // Default to true for blob downloads
    };
    if (options?.params) {
      (requestOptions as { params?: HttpParams }).params = this.buildParams(
        options.params
      );
    }
    try {
      const result = await firstValueFrom(
        this.http.post(url, body, requestOptions)
      );
      // When responseType is 'blob', HttpClient returns Blob directly
      return result as unknown as Blob;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.handleError(error);
      }
      throw error;
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

