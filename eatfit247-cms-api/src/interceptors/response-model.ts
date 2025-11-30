import { IResponse } from "@eatfit247-common/lib";

export class ResponseModel<T> implements IResponse<T> {
  data: T;
}
