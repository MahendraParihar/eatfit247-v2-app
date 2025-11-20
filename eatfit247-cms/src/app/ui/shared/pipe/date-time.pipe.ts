import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import { Constants } from '../../../constants/Constants';

@Pipe({
  name: 'appDateTime',
  standalone: false
})
export class DateTimePipe implements PipeTransform {
  transform(value: any, type: string = 'dateTime'): string {
    if (value) {
      switch (type) {
        case 'onlyDate':
          return moment(value).format(Constants.DEFAULT_DATE_FORMAT);
        case 'onlyTime':
          return moment(value, Constants.DEFAULT_TIME_FORMAT).format(Constants.DISPLAY_TIME_FORMAT);
        case 'dateTime':
        default:
          return moment(value, Constants.DEFAULT_DATE_TIME_FORMAT).format(Constants.DEFAULT_DATE_TIME_FORMAT);
      }
    }
    return '';
  }
}
