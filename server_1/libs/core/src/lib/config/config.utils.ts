import * as path from 'path';

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

/**
 * Resolves the private storage root (files that must never be served publicly).
 * Defaults to a `private-files` folder next to the static asset root, and refuses
 * any location that overlaps the static root, because ServeStaticModule exposes
 * everything under it at /media-files.
 */
export function resolvePrivateAssetPath(staticAssetPath: string, configuredPath?: string): string {
  const staticRoot = path.resolve(staticAssetPath);
  const privateRoot = path.resolve(configuredPath || path.join(staticRoot, '..', 'private-files'));
  const isInside = (parent: string, child: string): boolean => {
    const relative = path.relative(parent, child);
    return relative === '' || (relative.split(path.sep)[0] !== '..' && !path.isAbsolute(relative));
  };
  if (isInside(staticRoot, privateRoot) || isInside(privateRoot, staticRoot)) {
    throw Error(`PRIVATE_ASSET_PATH (${privateRoot}) must not overlap ASSET_PATH (${staticRoot})`);
  }
  return privateRoot;
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

