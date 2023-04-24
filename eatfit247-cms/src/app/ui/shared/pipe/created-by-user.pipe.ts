import {Pipe, PipeTransform} from '@angular/core';
import {AdminShortInfoModel} from "../../../models/admin-short-info.model";

@Pipe({
  name: 'appCreatedBy'
})
export class CreatedByUserPipe implements PipeTransform {
  transform(createdBy: AdminShortInfoModel): string {
    if (createdBy) {
      return (`${createdBy.firstName ? createdBy.firstName : ''} ${createdBy.lastName ? createdBy.lastName : ''}`).trim();
    }
    return '';
  }
}
