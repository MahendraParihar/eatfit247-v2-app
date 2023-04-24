import {AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {Constants} from "../constants/Constants";

export class ValidationUtil {


  static validateAllFormFields(formGroup: UntypedFormGroup): any {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({onlySelf: true});
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof UntypedFormArray) {
        for (const controlNested of control.controls) {
          if (controlNested instanceof UntypedFormControl) {
            controlNested.markAsTouched({onlySelf: true});
          }
          if (controlNested instanceof UntypedFormGroup) {
            this.validateAllFormFields(controlNested);
          }
        }
      }
    });
  }

  static weightValidation(control: AbstractControl) {
    const regexp = new RegExp(Constants.FLOAT_REGEX);
    if (!regexp.test(control.value)) {
      return {invalidWeight: true};
    }
    return null;
  }

  static numberValidation(control: AbstractControl) {
    const regexp = new RegExp(Constants.NUMBER_REGEX);
    if (!regexp.test(control.value)) {
      return {invalidNumber: true};
    }
    return null;
  }

  static latitudeValidation(control: AbstractControl) {
    const regexp = new RegExp(Constants.LAT_REGEX);
    if (!regexp.test(control.value)) {
      return {invalidLatitude: true};
    }
    return null;
  }

  static longitudeValidation(control: AbstractControl) {
    const regexp = new RegExp(Constants.LONG_REGEX);
    if (!regexp.test(control.value)) {
      return {invalidLongitude: true};
    }
    return null;
  }

  static heightValidation(control: AbstractControl) {
    const regexp = new RegExp(Constants.FLOAT_REGEX);
    if (!regexp.test(control.value)) {
      return {invalidHeight: true};
    }
    return null;
  }

  private static isNonEmptyString(data: any): boolean {
    if (typeof data !== 'string') {
      return false;
    }
    return data !== '';

  }
}
