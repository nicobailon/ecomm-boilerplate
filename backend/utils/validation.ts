import { MONGODB_OBJECTID_REGEX } from './constants.js';

export function isValidObjectId(id: string): boolean {
  return MONGODB_OBJECTID_REGEX.test(id);
}