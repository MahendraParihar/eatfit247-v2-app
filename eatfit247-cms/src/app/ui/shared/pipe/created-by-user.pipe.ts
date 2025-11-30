import { Pipe, PipeTransform } from '@angular/core';
import { IAdminShortInfo } from 'shared-lib';

@Pipe({
  name: 'appCreatedBy',
  standalone: false
})
export class CreatedByUserPipe implements PipeTransform {
  transform(createdBy: IAdminShortInfo): string {
    if (createdBy) {
      return (`${createdBy.firstName ? createdBy.firstName : ''} ${createdBy.lastName ? createdBy.lastName : ''}`).trim();
    }
    return '';
  }
}
