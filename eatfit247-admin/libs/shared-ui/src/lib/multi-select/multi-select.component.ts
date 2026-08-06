import { Component, ElementRef, Input, ViewChild, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { IDropdownItem } from '@eatfit247-shared-lib';

export type MultiSelectValue = number | string;

/**
 * Chips + autocomplete multi-select over a static option list.
 *
 * Used where a plain `mat-select multiple` is unusable because the list is long
 * (the country list is ~230 entries). Filtering is client-side; for server-side
 * search see RecipeMultiSelectComponent in the recipes lib.
 */
@Component({
  selector: 'shared-ui-multi-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true,
    },
  ],
})
export class MultiSelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  @Input() label = '';
  @Input() placeholder = 'Type to filter';
  @Input() emptyMessage = 'No matches';

  @Input()
  set options(value: IDropdownItem[]) {
    this.allOptions = value ?? [];
    this.refreshFiltered();
  }

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  allOptions: IDropdownItem[] = [];
  filteredOptions: IDropdownItem[] = [];
  selectedIds: MultiSelectValue[] = [];
  isDisabled = false;

  private onChange: (value: MultiSelectValue[]) => void = () => undefined;
  onTouched: () => void = () => undefined;

  constructor() {
    this.searchControl.valueChanges.subscribe(() => this.refreshFiltered());
  }

  get selectedOptions(): IDropdownItem[] {
    return this.selectedIds
      .map((id) => this.allOptions.find((o) => o.id === id))
      .filter((o): o is IDropdownItem => !!o);
  }

  writeValue(value: MultiSelectValue[] | null): void {
    this.selectedIds = Array.isArray(value) ? [...value] : [];
    this.refreshFiltered();
  }

  registerOnChange(fn: (value: MultiSelectValue[]) => void): void {
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

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value as IDropdownItem;
    if (!this.selectedIds.includes(option.id)) {
      this.selectedIds = [...this.selectedIds, option.id];
      this.emit();
    }
    this.clearSearch();
  }

  remove(option: IDropdownItem): void {
    this.selectedIds = this.selectedIds.filter((id) => id !== option.id);
    this.emit();
  }

  /**
   * Selection is represented by chips, never by input text.
   *
   * MatAutocompleteTrigger writes the chosen option back into the control *after*
   * optionSelected fires, so clearing alone is not enough — the display function has
   * to render empty too, or the previous search term is left behind.
   */
  readonly displayEmpty = (): string => '';

  private clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.refreshFiltered();
  }

  /**
   * MatAutocompleteTrigger writes the selected option *object* into the control, so
   * the value is not always the string the type says it is. Reading it defensively
   * keeps valueChanges from throwing on selection.
   */
  private get searchTerm(): string {
    const value: unknown = this.searchControl.value;
    return typeof value === 'string' ? value : '';
  }

  private refreshFiltered(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredOptions = this.allOptions
      .filter((o) => !this.selectedIds.includes(o.id))
      .filter((o) => !term || o.label.toLowerCase().includes(term))
      // The list can be hundreds of entries; the autocomplete panel only needs a page.
      .slice(0, 50);
  }

  private emit(): void {
    this.onChange([...this.selectedIds]);
    this.onTouched();
    this.refreshFiltered();
  }
}
