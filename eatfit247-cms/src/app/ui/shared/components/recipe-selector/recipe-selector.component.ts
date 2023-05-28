import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { StringResources } from '../../../../enum/string-resources';
import { DropdownItem } from '../../../../interfaces/dropdown-item';
import { debounceTime, switchMap, tap } from 'rxjs';
import { find } from 'lodash';
import { MatChipInputEvent } from '@angular/material/chips';
import { SnackBarService } from '../../../../service/snack-bar.service';

@Component({
  selector: 'app-recipe-selector',
  templateUrl: './recipe-selector.component.html',
  styleUrls: ['./recipe-selector.component.scss'],
})
export class RecipeSelectorComponent implements OnInit {
  @Input()
  masterList: DropdownItem[];
  @Input()
  isMultiSelection: boolean = false;
  @Input()
  label: string;
  @Input()
  isRequired: boolean = true;
  @Output() userChangeEvent = new EventEmitter<any>();
  stringRes = StringResources;
  searchCtrl = new FormControl();
  isLoading = false;
  errorMsg: string;
  filteredList: DropdownItem[];
  selectedItemList: DropdownItem[] = [];
  @Input()
  selectedIds: number[] = [];
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef<HTMLInputElement>;

  constructor(private snackbarService: SnackBarService) {
  }

  ngOnInit(): void {
    for (const s of this.selectedIds) {
      const f = find(this.masterList, { id: s });
      if (f) {
        this.selectedItemList.push(f);
      }
    }
    this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      tap(() => {
          this.errorMsg = '';
          this.filteredList = [];
          this.isLoading = true;
        },
      ),
      switchMap((value: string) => this.getFilteredList(value)),
    ).subscribe(data => {
      this.filteredList = data;
    });
    if (this.selectedItemList && this.selectedItemList.length > 0) {
      this.emitEvent();
    }
  }

  async getFilteredList(searchStr: string): Promise<DropdownItem[]> {
    let ddList: DropdownItem[] = [];
    try {
      if (!searchStr) {
        this.errorMsg = 'empty search text';
        this.isLoading = false;
        return ddList;
      }
      if (searchStr && searchStr.length < 1) {
        this.errorMsg = 'search text should be min 1 char.';
        this.isLoading = false;
        return ddList;
      }
      ddList = this.masterList.filter(o => o.name.toLowerCase().includes(searchStr.toLowerCase()));
      this.isLoading = false;
      if (ddList.length === 0) {
        this.errorMsg = 'No recipe found';
      }
    } catch (e) {
      this.isLoading = false;
    }
    return ddList;
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (event.option.value) {
      const findObj = find(this.selectedItemList, { id: event.option.value.id });
      if (!findObj) {
        this.selectedItemList.push(event.option.value);
        this.emitEvent();
        this.searchInput.nativeElement.value = '';
        this.searchCtrl.setValue(null);
      }
    }
  }

  add(event: MatChipInputEvent): void {
    if (!this.isMultiSelection && this.selectedItemList && this.selectedItemList.length > 1) {
      this.snackbarService.showWarning('Only one item allow to select');
      return;
    }
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value: any = event.value;
      if (value) {
        const findObj = find(this.selectedItemList, { id: value.id });
        if (!findObj) {
          this.selectedItemList.push(value);
          this.emitEvent();
        }
        // Reset the input value
        if (input) {
          input.value = '';
        }
        this.searchCtrl.setValue(null);
      }
    }
  }

  remove(index: number): void {
    if (index >= 0) {
      this.selectedItemList.splice(index, 1);
      this.emitEvent();
    }
  }

  private emitEvent(): void {
    this.userChangeEvent.emit(this.selectedItemList);
  }
}
