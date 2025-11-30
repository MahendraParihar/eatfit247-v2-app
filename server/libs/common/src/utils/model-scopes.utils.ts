import { Includeable } from 'sequelize';
import { MstAdminUser } from '../models/admin';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE } from '../constants';

/**
 * Creates include options for createdByUser relationship
 * @param required - Whether the relationship is required (default: false)
 * @returns Includeable for createdByUser
 */
export function getCreatedByUserInclude(required: boolean = false): Includeable {
  return {
    attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
    model: MstAdminUser,
    required,
    as: 'createdByUser',
  };
}

/**
 * Creates include options for updatedByUser relationship
 * @param required - Whether the relationship is required (default: false)
 * @returns Includeable for updatedByUser
 */
export function getUpdatedByUserInclude(required: boolean = false): Includeable {
  return {
    attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
    model: MstAdminUser,
    required,
    as: 'updatedByUser',
  };
}

/**
 * Creates a scope definition with both createdByUser and updatedByUser includes
 * @param required - Whether the relationships are required (default: false)
 * @returns Scope definition object
 */
export function getAdminUserScope(required: boolean = false) {
  return {
    include: [
      getCreatedByUserInclude(required),
      getUpdatedByUserInclude(required),
    ],
  };
}

/**
 * Common scope definitions for models with admin user relationships
 * These can be used directly in @Scopes decorator
 */
export const CommonScopes = {
  /**
   * List scope - includes admin user info (optional relationships)
   */
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  /**
   * Details scope - includes admin user info (optional relationships)
   */
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  /**
   * List scope with required relationships
   */
  listRequired: {
    include: [
      getCreatedByUserInclude(true),
      getUpdatedByUserInclude(true),
    ],
  },
  /**
   * Details scope with required relationships
   */
  detailsRequired: {
    include: [
      getCreatedByUserInclude(true),
      getUpdatedByUserInclude(true),
    ],
  },
};

