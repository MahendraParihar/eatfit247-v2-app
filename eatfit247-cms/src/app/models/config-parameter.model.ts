export class ConfigParameterModel {
  configParamId: number;
  configParamName: string;
  configParamValue: string;
  fieldTypeId: number;
  fieldType: string;

  static fromJson(data: any): ConfigParameterModel | null {
    if (!data) {
      return null;
    }
    const configParamObj: ConfigParameterModel = new ConfigParameterModel();
    configParamObj.configParamId = data.configId;
    configParamObj.configParamName = data.configName;
    configParamObj.configParamValue = data.configValue;
    configParamObj.fieldTypeId = data.fieldTypeId;
    configParamObj.fieldType = data.ConfigFieldTypeMap.fieldType;
    return configParamObj;
  }
}
