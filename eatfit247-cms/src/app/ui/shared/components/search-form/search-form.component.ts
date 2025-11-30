import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { StringResources } from '../../../../enum/string-resources';
import { StatusList } from '../../../../constants/status-list';
import { ITableListFilter } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  @Input()
  searchModel: ITableListFilter;
  @Output()
  searchResultEvent = new EventEmitter<ITableListFilter>();
  stringRes = StringResources;
  statusList = StatusList;
  searchFormGroup = this.fb.group({
    name: [null],
    active: [null],
    createdFrom: [null],
    createdTo: [null]
  });

  constructor() {
  }

  ngOnInit(): void {
    if (this.searchModel) {
      /*this.searchFormGroup.patchValue({
        name: this.searchModel.name ? this.searchModel.name : '',
        active: this.searchModel.active ? this.searchModel.active : '',
        createdFrom: this.searchModel.createdFrom ? this.searchModel.createdFrom : null,
        createdTo: this.searchModel.createdTo ? this.searchModel.createdTo : null,
      });*/
    }
  }

  async clearSearchForm(): Promise<void> {
    this.searchFormGroup.reset();
    this.setFormDataToModel();
    this.searchResultEvent.emit(this.searchModel);
  }

  async searchResult(): Promise<void> {
    this.setFormDataToModel();
    this.searchResultEvent.emit(this.searchModel);
  }

  private setFormDataToModel(): void {
    const formValue = this.searchFormGroup.value;
    this.searchModel.name = formValue.name ? formValue.name : null;
    this.searchModel.active = formValue.active; // Send value as it is
    this.searchModel.createdFrom = formValue.createdFrom ? formValue.createdFrom.format('YYYY-MM-DD') : null;
    this.searchModel.createdTo = formValue.createdTo ? formValue.createdTo.format('YYYY-MM-DD') : null;
  }
}
