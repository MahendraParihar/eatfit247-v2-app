import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ICountry } from '@eatfit247-shared-lib';
import { CountryApiService } from '../api.service';

@Component({
  selector: 'lib-country',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './country.html',
  styleUrl: './country.scss',
})
export class Country extends BaseListComponent<ICountry> {
  protected apiService = inject(CountryApiService);

  protected listConfig = {
    editRoute: '/lov-master/country/edit',
    createRoute: '/lov-master/country/new',
    searchPlaceholder: 'Search country...',
    emptyMessage: 'No country records found',
  };

  protected buildEntityColumns(): ITableColumn<ICountry>[] {
    return [
      { key: 'countryId', label: 'ID', dataKey: 'countryId', sortable: true, width: '80px' },
      { key: 'country', label: 'Country', dataKey: 'country', sortable: true, searchable: true },
      { key: 'countryCode', label: 'Country Code', dataKey: 'countryCode', sortable: true, width: '120px' },
      { key: 'taxType', label: 'Tax Type', dataKey: 'taxType', sortable: true, width: '120px' },
      { key: 'defaultTaxPercentage', label: 'Default Tax %', dataKey: 'defaultTaxPercentage', sortable: true, width: '130px', formatter: (value) => value ? `${value}%` : '0%' },
    ];
  }

  protected getItemId(item: ICountry): number { return item.countryId; }
  protected getItemDisplayName(item: ICountry): string { return item.country; }
}
