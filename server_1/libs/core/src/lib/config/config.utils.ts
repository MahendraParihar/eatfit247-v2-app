export const createUniqueHashFromString = (str: string): number => {
  let hash = 0,
    i,
    chr,
    len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export function converterFactory<T>(
  getValueFn: (key: string) => string,
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

export function generateRandomPassword() {
  const length = 12; // Set the desired length of the password
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const allChars = uppercaseChars + lowercaseChars + numberChars;

  let password = '';

  // Ensure at least one uppercase, one lowercase, and one number
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));

  // Generate the remaining characters
  for (let i = 3; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the characters in the password
  const passwordArr = password.split('');
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
  }
  return passwordArr.join('');
}

