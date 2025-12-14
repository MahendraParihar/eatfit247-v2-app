import { AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

export class ValidationUtil {
  public static EMAIL_REGEX = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  public static AGE_REGEX = '^(0?[1-9]|[1-9][0-9]|[1][1-9][1-9]|200)$';
  public static PASSWORD_REGEX =
    '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$';
  public static PHONE_REGEX = '/^([+]\\d{2})?\\d{10}$/';
  public static FLOAT_REGEX = '^[0-9]\\d*(\\.\\d+)?$';
  public static LAT_REGEX = '/^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,15}/g';
  public static LONG_REGEX = '/^-?(([-+]?)([\\d]{1,3})((\\.)(\\d+))?)/g';
  public static NUMBER_REGEX = '^[0-9]*$';
  public static DEFAULT_CURRENCY = 'INR';

  static validateAllFormFields(formGroup: UntypedFormGroup): any {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof UntypedFormArray) {
        for (const controlNested of control.controls) {
          if (controlNested instanceof UntypedFormControl) {
            controlNested.markAsTouched({ onlySelf: true });
          }
          if (controlNested instanceof UntypedFormGroup) {
            this.validateAllFormFields(controlNested);
          }
        }
      }
    });
  }

  static floatValidation(control: AbstractControl) {
    const regexp = new RegExp(this.FLOAT_REGEX);
    if (!regexp.test(control.value)) {
      return { invalidNumber: true };
    }
    return null;
  }

  static numberValidation(control: AbstractControl) {
    const regexp = new RegExp(this.NUMBER_REGEX);
    if (!regexp.test(control.value)) {
      return { invalidNumber: true };
    }
    return null;
  }

  static latitudeValidation(control: AbstractControl) {
    const regexp = new RegExp(this.LAT_REGEX);
    if (!regexp.test(control.value)) {
      return { invalidLatitude: true };
    }
    return null;
  }

  static longitudeValidation(control: AbstractControl) {
    const regexp = new RegExp(this.LONG_REGEX);
    if (!regexp.test(control.value)) {
      return { invalidLongitude: true };
    }
    return null;
  }

  static heightValidation(control: AbstractControl) {
    const regexp = new RegExp(this.FLOAT_REGEX);
    if (!regexp.test(control.value)) {
      return { invalidHeight: true };
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
