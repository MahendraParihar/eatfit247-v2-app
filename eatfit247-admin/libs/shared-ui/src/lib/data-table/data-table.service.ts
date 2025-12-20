import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ITablePagination, ITableSort } from './data-table.interface';
import { ITableListFilter } from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class DataTableService {
  private paginationSubject = new BehaviorSubject<ITablePagination>({
    pageIndex: 0,
    pageSize: 10,
    length: 0,
  });

  private sortSubject = new BehaviorSubject<ITableSort>({
    active: '',
    direction: '',
  });

  private searchSubject = new BehaviorSubject<string>('');

  pagination$: Observable<ITablePagination> = this.paginationSubject.asObservable();
  sort$: Observable<ITableSort> = this.sortSubject.asObservable();
  search$: Observable<string> = this.searchSubject.asObservable();

  updatePagination(pagination: ITablePagination): void {
    this.paginationSubject.next(pagination);
  }

  updateSort(sort: ITableSort): void {
    this.sortSubject.next(sort);
  }

  updateSearch(search: string): void {
    this.searchSubject.next(search);
  }

  getCurrentPagination(): ITablePagination {
    return this.paginationSubject.value;
  }

  getCurrentSort(): ITableSort {
    return this.sortSubject.value;
  }

  getCurrentSearch(): string {
    return this.searchSubject.value;
  }

  /**
   * Builds query parameters from current table state
   */
  buildQueryParams(additionalParams?: Record<string, any>): ITableListFilter {
    const pagination = this.getCurrentPagination();
    const sort = this.getCurrentSort();
    const search = this.getCurrentSearch();

    const params: ITableListFilter = {
      page: pagination.pageIndex,
      limit: pagination.pageSize,
    };

    if (search) {
      params.search = search;
    }

    // Add sorting if available
    if (sort.active && sort.direction) {
      // Note: Adjust based on your API's sorting format
      (params as any).sortBy = sort.active;
      (params as any).sortOrder = sort.direction.toUpperCase();
    }

    // Merge additional params
    if (additionalParams) {
      Object.assign(params, additionalParams);
    }

    return params;
  }

  reset(): void {
    this.paginationSubject.next({
      pageIndex: 0,
      pageSize: 10,
      length: 0,
    });
    this.sortSubject.next({
      active: '',
      direction: '',
    });
    this.searchSubject.next('');
  }
}

