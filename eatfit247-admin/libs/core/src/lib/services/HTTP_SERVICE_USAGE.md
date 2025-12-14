# HTTP Service Usage Guide

## Overview

The `HttpService` is a centralized service for all HTTP operations in the application. It provides consistent error handling, parameter building, and URL construction. **All methods use async/await pattern with Promises.**

## Basic Usage

### Import the Service

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '@core';

@Injectable({
  providedIn: 'root',
})
export class YourApiService {
  private readonly endpoint = '/your-endpoint';

  constructor(private httpService: HttpService) {}
}
```

## Methods

### GET Request

```typescript
// Simple GET
async getList(): Promise<YourType[]> {
  return await this.httpService.get<YourType[]>(`${this.endpoint}/list`);
}

// GET with query parameters
async getList(params?: { page?: number; search?: string }): Promise<YourType[]> {
  return await this.httpService.get<YourType[]>(`${this.endpoint}/list`, { params });
}

// GET by ID
async getById(id: number): Promise<YourType> {
  return await this.httpService.get<YourType>(`${this.endpoint}/${id}`);
}
```

### POST Request

```typescript
// POST with body
async create(data: YourType): Promise<void> {
  return await this.httpService.post<void>(`${this.endpoint}`, data);
}

// POST with custom headers
async createWithHeaders(data: YourType): Promise<YourType> {
  return await this.httpService.post<YourType>(`${this.endpoint}`, data, {
    headers: {
      'Custom-Header': 'value',
    },
  });
}
```

### PUT Request

```typescript
async update(id: number, data: YourType): Promise<void> {
  return await this.httpService.put<void>(`${this.endpoint}/${id}`, data);
}
```

### PATCH Request

```typescript
async updateStatus(id: number, status: boolean): Promise<void> {
  return await this.httpService.patch<void>(`${this.endpoint}/${id}/status`, { status });
}
```

### DELETE Request

```typescript
async delete(id: number): Promise<void> {
  return await this.httpService.delete<void>(`${this.endpoint}/${id}`);
}
```

## Features

### Automatic URL Construction
- Base URL is automatically prepended
- Leading slashes are handled automatically
- Example: `httpService.get('users')` → `{baseUrl}/users`
- Example: `httpService.get('/users')` → `{baseUrl}/users`

### Query Parameters
- Automatically converts objects to HttpParams
- Filters out null, undefined, and empty string values
- Supports arrays (appends multiple values)

```typescript
// This:
httpService.get('users', { 
  params: { page: 1, search: 'john', tags: ['admin', 'user'] }
})

// Becomes: /users?page=1&search=john&tags=admin&tags=user
```

### Error Handling
- All errors are caught and formatted consistently
- Returns error object with `status`, `message`, and `error` properties
- Works with existing `HttpErrorInterceptor`

### Integration with Auth
- Works seamlessly with `AuthInterceptor`
- Authorization headers are automatically added via interceptor

## Error Handling

All methods use try/catch for error handling:

```typescript
async getList(): Promise<YourType[]> {
  try {
    return await this.httpService.get<YourType[]>(`${this.endpoint}/list`);
  } catch (error: any) {
    // Handle error
    console.error('Failed to fetch list:', error.message);
    throw error;
  }
}
```

## Usage in Components

```typescript
async onSubmit(): Promise<void> {
  this.loading = true;
  try {
    const result = await this.apiService.create(this.formData);
    // Handle success
    this.router.navigate(['/success']);
  } catch (error: any) {
    // Handle error
    this.errorMessage = error?.message || 'An error occurred';
  } finally {
    this.loading = false;
  }
}
```

## Migration from Observable-based Services

### Before (using Observables):
```typescript
constructor(private http: HttpClient) {}

getList(params?: any): Observable<YourType[]> {
  return this.http.get<YourType[]>(`${this.apiUrl}/endpoint/list`, {
    params: this.buildParams(params),
  });
}

// In component:
this.service.getList().subscribe({
  next: (data) => { /* handle success */ },
  error: (error) => { /* handle error */ }
});
```

### After (using HttpService with async/await):
```typescript
constructor(private httpService: HttpService) {}

async getList(params?: any): Promise<YourType[]> {
  return await this.httpService.get<YourType[]>(`/endpoint/list`, { params });
}

// In component:
async loadData(): Promise<void> {
  try {
    const data = await this.service.getList();
    // handle success
  } catch (error) {
    // handle error
  }
}
```

## Benefits

1. **Consistency**: All HTTP calls use the same service
2. **Error Handling**: Centralized error handling
3. **URL Management**: Automatic base URL handling
4. **Type Safety**: Full TypeScript support
5. **Maintainability**: Single place to update HTTP logic
6. **Testing**: Easier to mock and test

