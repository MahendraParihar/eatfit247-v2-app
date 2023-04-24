import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, AbstractControlDirective} from "@angular/forms";
import {StringResources} from "../../../../enum/string-resources";

@Component({
  selector: 'app-input-error',
  templateUrl: './input-error.component.html',
  styleUrls: ['./input-error.component.scss']
})
export class InputErrorComponent implements OnInit {

  @Input()
  public control?: AbstractControlDirective | AbstractControl | null;

  @Input()
  public controlName?: string;

  constructor() {
  }

  ngOnInit() {

  }

  shouldShowErrors(): boolean | null {
    if (this.control) {
      return this.control.errors && (this.control.dirty || this.control.touched);
    } else {
      return false;
    }

  }

  getError(): string[] | null {
    if (this.control) {
      for (const k in this.control.errors) {
        return this.getMessage(k, this.control.errors[k]);
      }
    }
    return null;
  }

  private getMessage(type: string, params: any): any {
    switch (type) {
      case 'required':
        if (this.controlName) {
          return this.controlName + ' is required';
        } else {
          return StringResources.REQUIRED;
        }
      case 'invalidNumber':
        return 'Invalid number';
      case 'matDatepickerParse':
        return StringResources.IN_VALID_DATE;
      case 'maxlength':
        return StringResources.IN_VALID_MAX_LENGTH + params.requiredLength;
      case 'minlength':
        return StringResources.IN_VALID_MIN_LENGTH + params.requiredLength;
      case 'invalidWeight':
        return StringResources.IN_VALID_WEIGHT;
      case 'invalidHeight':
        return StringResources.IN_VALID_HEIGHT;
      case 'min':
        return StringResources.IN_VALID_MIN_VALUE + params.min;
      case 'max':
        return StringResources.IN_VALID_MAX_VALUE + params.max;
      case 'invalidLatitude':
        return StringResources.IN_VALID_LATITUDE;
      case 'invalidLongitude':
        return StringResources.IN_VALID_LONGITUDE;
      default:
        return null;
    }

  }

}
