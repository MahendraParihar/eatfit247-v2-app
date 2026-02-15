import { Component, ElementRef, forwardRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap, takeUntil } from 'rxjs';
import { IDropdownItem } from '@eatfit247-shared-lib';
import { RecipesApiService } from '../api.service';

@Component({
  selector: 'lib-recipe-multi-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './recipe-multi-select.component.html',
  styleUrl: './recipe-multi-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RecipeMultiSelectComponent),
      multi: true
    }
  ]
})
export class RecipeMultiSelectComponent
  implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label = 'Recipes';
  @Input() placeholder = 'Type to search recipes';

  private _initialOptions: IDropdownItem[] = [];
  @Input() set initialOptions(value: IDropdownItem[] | null | undefined) {
    this._initialOptions = value || [];
    this.mergeInitialOptions();
  }

  searchControl = new FormControl<string>('', { nonNullable: true });
  filteredOptions: IDropdownItem[] = [];
  selectedItems: IDropdownItem[] = [];
  private selectedIds: number[] = [];
  private allKnownOptions = new Map<number, IDropdownItem>();

  @ViewChild('searchInput', { static: false }) searchInput?: ElementRef<HTMLInputElement>;

  loading = false;
  isDisabled = false;

  private destroy$ = new Subject<void>();
  private onChange: (value: number[]) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private apiService: RecipesApiService) {}

  ngOnInit(): void {
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(value: number[] | null): void {
    this.selectedIds = Array.isArray(value) ? value : [];
    this.syncSelectedItemsFromIds();
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable({ emitEvent: false });
    } else {
      this.searchControl.enable({ emitEvent: false });
    }
  }

  private coerceId(id: string | number): number {
    return typeof id === 'number' ? id : Number(id);
  }

  displayItem(item: IDropdownItem | null): string {
    return item ? item.label : '';
  }

  onOptionSelected(option: IDropdownItem): void {
    if (!option || this.isDisabled) {
      return;
    }
    const exists = this.selectedItems.some((i) => i.id === option.id);
    if (!exists) {
      this.selectedItems = [...this.selectedItems, option];
      this.allKnownOptions.set(this.coerceId(option.id), option);
      this.emitChanges();
    }
    // Clear search box after selection without triggering another search
    this.searchControl.setValue('', { emitEvent: false });
    this.filteredOptions = [];
    // Clear the input element directly to ensure it's visually cleared
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }
    this.onTouched();
  }

  remove(item: IDropdownItem): void {
    if (this.isDisabled) {
      return;
    }
    this.selectedItems = this.selectedItems.filter(
      (i) => i.id !== item.id
    );
    this.emitChanges();
    this.onTouched();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const term =
            typeof value === 'string'
              ? value.trim()
              : '';

          if (!term) {
            this.filteredOptions = [];
            return of(null);
          }

          this.loading = true;
          return this.apiService
            .searchDropdown({ search: term, page: 0, limit: 10 })
            .then(
              (res: Array<{ id: number; title: string; subtitle: string }>) => res,
              () => null
            );
        })
      )
      .subscribe((res: Array<{ id: number; title: string; subtitle: string }> | null) => {
        this.loading = false;
        if (!res) {
          this.filteredOptions = [];
          return;
        }
        const options: IDropdownItem[] = res.map(
          (item) =>
            <IDropdownItem>{
              id: item.id,
              label: item.title,
              metadata: { subtitle: item.subtitle }
            }
        );

        options.forEach((opt) => {
          this.allKnownOptions.set(this.coerceId(opt.id), opt);
        });

        const selectedIdSet = new Set(this.selectedIds);
        this.filteredOptions = options.filter(
          (opt) => !selectedIdSet.has(this.coerceId(opt.id))
        );
      });
  }

  private emitChanges(): void {
    const ids: number[] = this.selectedItems.map((i) =>
      this.coerceId(i.id)
    );
    this.selectedIds = ids;
    this.onChange(ids);
  }

  private mergeInitialOptions(): void {
    if (!this._initialOptions || this._initialOptions.length === 0) {
      return;
    }
    this._initialOptions.forEach((opt) => {
      if (opt && typeof opt.id === 'number') {
        this.allKnownOptions.set(opt.id, opt);
      }
    });
    this.syncSelectedItemsFromIds();
  }

  private syncSelectedItemsFromIds(): void {
    if (!this.selectedIds || this.selectedIds.length === 0) {
      this.selectedItems = [];
      return;
    }
    const items: IDropdownItem[] = [];
    this.selectedIds.forEach((id) => {
      const existing = this.allKnownOptions.get(id);
      if (existing) {
        items.push(existing);
      } else {
        // Fallback placeholder until we know the label from search / initial options
        items.push(<IDropdownItem>{
          id,
          label: `Recipe #${id}`
        });
      }
    });
    this.selectedItems = items;
  }
}


