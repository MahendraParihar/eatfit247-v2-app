import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * HTTP Service
 *
 * Provides a centralized HTTP client using axios with support for:
 * - GET, POST, PUT, DELETE methods
 * - Optional headers
 * - Optional query parameters
 * - Optional request body
 */
@Injectable()
export class HttpService {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds default timeout
    });
  }

  /**
   * GET request
   * @param url - The URL to make the request to
   * @param params - Optional query parameters (will be converted to URLSearchParams)
   * @param headers - Optional HTTP headers
   * @returns Promise with the response data
   */
  async get<T = any>(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    if (!headers) {
      headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }
    const config: AxiosRequestConfig = {
      method: 'GET',
      url,
      params,
      headers,
    };

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   * @param url - The URL to make the request to
   * @param body - Optional request body
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with the response data
   */
  async post<T = any>(
    url: string,
    body?: any,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    if (!headers) {
      headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }
    const config: AxiosRequestConfig = {
      method: 'POST',
      url,
      data: body,
      params,
      headers,
    };

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   * @param url - The URL to make the request to
   * @param body - Optional request body
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with the response data
   */
  async put<T = any>(
    url: string,
    body?: any,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    if (!headers) {
      headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }
    const config: AxiosRequestConfig = {
      method: 'PUT',
      url,
      data: body,
      params,
      headers,
    };

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   * @param url - The URL to make the request to
   * @param params - Optional query parameters
   * @param headers - Optional HTTP headers
   * @returns Promise with the response data
   */
  async delete<T = any>(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    if (!headers) {
      headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      url,
      params,
      headers,
    };

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle axios errors and provide meaningful error messages
   * @param error - The error object from axios
   * @returns Error with enhanced information
   */
  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const statusText = error.response.statusText;
      const data = error.response.data;
      const message = `HTTP Error ${status} ${statusText}: ${JSON.stringify(data)}`;

      const httpError = new Error(message);
      (httpError as any).status = status;
      (httpError as any).statusText = statusText;
      (httpError as any).data = data;
      (httpError as any).response = error.response;

      return httpError;
    } else if (error.request) {
      // The request was made but no response was received
      const message = `No response received: ${error.message}`;
      const requestError = new Error(message);
      (requestError as any).request = error.request;

      return requestError;
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(`Request setup error: ${error.message}`);
    }
  }

  /**
   * Get the underlying axios instance for advanced usage
   * @returns The axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
