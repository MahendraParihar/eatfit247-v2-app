import * as moment from "moment";
import {Constants} from "../constants/Constants";

export class CommonSearchModel {
  name?: string;
  active?: boolean;
  createdFrom?: moment.Moment;
  createdTo?: moment.Moment;
  pageNumber: number = 0;
  pageSize: number = Constants.DEFAULT_PAGE_SIZE;

  static fromJson(data: any): CommonSearchModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: CommonSearchModel = new CommonSearchModel();
    authUserObj.name = data.name;
    authUserObj.active = data.active;
    authUserObj.createdFrom = data.createdFrom ? moment(data.createdFrom) : null;
    authUserObj.createdTo = data.createdTo ? moment(data.createdTo) : null;
    return authUserObj;
  }
}
