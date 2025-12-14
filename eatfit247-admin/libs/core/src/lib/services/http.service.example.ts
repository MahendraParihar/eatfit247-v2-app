/**
 * HTTP Service Usage Examples
 * 
 * This file demonstrates how to use the HttpService in API services
 * All methods use async/await pattern
 */

import { Injectable } from '@angular/core';
import { HttpService } from './http.service';

// Example: Using HttpService in an API service
@Injectable({
  providedIn: 'root',
})
export class ExampleApiService {
  private readonly endpoint = '/example';

  constructor(private httpService: HttpService) {}

  // GET request with query parameters
  async getList(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    return await this.httpService.get(`${this.endpoint}/list`, { params });
  }

  // GET request by ID
  async getById(id: number): Promise<any> {
    return await this.httpService.get(`${this.endpoint}/${id}`);
  }

  // POST request
  async create(data: any): Promise<any> {
    return await this.httpService.post(`${this.endpoint}`, data);
  }

  // PUT request
  async update(id: number, data: any): Promise<any> {
    return await this.httpService.put(`${this.endpoint}/${id}`, data);
  }

  // PATCH request
  async updateStatus(id: number, status: boolean): Promise<any> {
    return await this.httpService.patch(`${this.endpoint}/${id}/status`, { status });
  }

  // DELETE request
  async delete(id: number): Promise<void> {
    return await this.httpService.delete<void>(`${this.endpoint}/${id}`);
  }

  // GET request with custom headers
  async getWithHeaders(id: number): Promise<any> {
    return await this.httpService.get(`${this.endpoint}/${id}`, {
      headers: {
        'Custom-Header': 'value',
      },
    });
  }

  // POST request with file upload (blob response)
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return await this.httpService.post(`${this.endpoint}/upload`, formData, {
      reportProgress: true,
    });
  }
}

