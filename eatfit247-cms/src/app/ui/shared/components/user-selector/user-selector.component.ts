import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {StringResources} from "../../../../enum/string-resources";
import {FormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {debounceTime, switchMap, tap} from "rxjs";
import {UserDropdownItem} from "../../../../interfaces/dropdown-item";
import {HttpService} from "../../../../service/http.service";
import {ApiUrlEnum} from "../../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../../enum/server-response-enum";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {find} from 'lodash';


@Component({
  selector: 'app-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss']
})
export class UserSelectorComponent implements OnInit {

  @Input()
  isMultiSelection: boolean = false;

  @Input()
  controlName: string;

  @Input()
  formGroupCtr: UntypedFormGroup;

  @Input()
  label: string;

  @Input()
  isRequired: boolean = true;

  @Output() userChangeEvent = new EventEmitter<any>();

  stringRes = StringResources;

  searchCtrl = new FormControl();
  isLoading = false;
  errorMsg: string;

  userList: UserDropdownItem[]

  @Input()
  selectedUserList: UserDropdownItem[] = [];

  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];

  @ViewChild('auto', {static: false}) matAutocomplete: MatAutocomplete;
  @ViewChild('searchInput', {static: false}) searchInput: ElementRef<HTMLInputElement>;

  constructor(
    private httpService: HttpService) {
  }

  get formGroupControl() {
    return this.formGroupCtr.controls;
  }

  ngOnInit(): void {
    this.formGroupCtr.addControl(this.controlName, new FormControl(null, [Validators.required]));
    this.searchCtrl.valueChanges.pipe(
      debounceTime(500),
      tap(() => {
          this.errorMsg = "";
          this.userList = [];
          this.isLoading = true;
        }
      ),
      switchMap((value: string) => this.getUserList(value))
    ).subscribe(data => {
      this.userList = data;
    });
    if (this.selectedUserList && this.selectedUserList.length > 0) {
      this.emitEvent();
    }
  }

  async getUserList(searchStr: string): Promise<UserDropdownItem[]> {
    const ddList: UserDropdownItem[] = [];
    if (!searchStr) {
      this.errorMsg = 'empty search text';
      this.isLoading = false;
      return ddList;
    }
    if (searchStr && searchStr.length < 3) {
      this.errorMsg = 'search text should be min 3 char.';
      this.isLoading = false;
      return ddList;
    }
    const payload = {
      searchStr: searchStr
    }
    const res = await this.httpService.getRequest(ApiUrlEnum.SEARCH_USER, null, payload, false);
    this.isLoading = false;
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data) {
            const findObj = find(this.selectedUserList, {id: s.id});
            if (!findObj) {
              ddList.push(<UserDropdownItem>{
                id: s.id,
                name: s.name,
                subText: s.subText,
                imagePath: s.imagePath ? (Array.isArray(s.imagePath) ? s.imagePath : [s.imagePath]) : [],
                isSelected: s.isSelected,
                parentId: s.parentId,
              });
            }
          }
          break;
        case ServerResponseEnum.WARNING:
        case ServerResponseEnum.ERROR:
          this.errorMsg = res.message;
          break;
      }
    }
    return ddList;
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (event.option.value) {
      const findObj = find(this.selectedUserList, {id: event.option.value.id});
      if (!findObj) {
        this.selectedUserList.push(event.option.value);
        this.emitEvent();
        this.searchInput.nativeElement.value = '';
        this.searchCtrl.setValue(null);
      }
    }
  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value: any = event.value;
      if (value) {
        const findObj = find(this.selectedUserList, {id: value.id});
        if (!findObj) {
          this.selectedUserList.push(value);
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
      this.selectedUserList.splice(index, 1);
      this.emitEvent();
    }
  }

  getFormControl(): any {
    return this.formGroupCtr.controls[`${this.controlName}`];
  }

  private emitEvent(): void {
    this.userChangeEvent.emit(this.selectedUserList);
  }
}
