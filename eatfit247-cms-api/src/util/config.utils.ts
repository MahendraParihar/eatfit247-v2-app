export function converterFactory<T>(
  getValueFn: (string) => string,
  converterFn: (key: string, isRequired: boolean, defaulValue?: T) => T,
) {
  return (key: string, isRequired = true, defaultValue?: T) => {
    const flag = getValueFn(key);
    if (typeof flag === 'string') {
      try {
        return converterFn(flag, isRequired, defaultValue);
      } catch (error) {
        throw Error(`Config Valueof ${key}  not set Correctly, failed in parsing`);
      }
    } else if (isRequired) {
      throw Error(`Config Valueof ${key}  not set`);
    }
    return defaultValue;
  };
}

export function valueToString(flag: string): string {
  return flag;
}

export function valueToNumber(flag: string): number {
  return +flag;
}

export function valueToBoolean(flag: string): boolean {
  const lowerCaseFlag = flag.toLowerCase();
  if (lowerCaseFlag === 'true') {
    return true;
  } else if (lowerCaseFlag === 'false') {
    return false;
  }
  throw new Error('Boolean value wrongly set');
}