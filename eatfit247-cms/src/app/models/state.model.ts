export class StateModel {
  id?: number;
  name?: string;
  code?: string;
  country?: string;
  countryId?: number;
  active?: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;

  static fromJson(data: any): StateModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: StateModel = new StateModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.code = data.code;
    authUserObj.country = data.country;
    authUserObj.countryId = data.countryId;
    authUserObj.active = data.active;
    authUserObj.createdBy = data.createdBy;
    authUserObj.updatedBy = data.updatedBy;
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
