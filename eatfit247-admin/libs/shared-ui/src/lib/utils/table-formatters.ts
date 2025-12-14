/**
 * Utility functions for table column formatters
 */

/**
 * Formats a user object (createdByUser or updatedByUser) for display in table columns
 * @param value - The value from the cell (may be the user object or a primitive)
 * @param row - The entire row object
 * @param userField - The field name in the row that contains the user object (e.g., 'createdByUser', 'updatedByUser')
 * @returns Formatted string with user's full name or fallback values
 */
export function formatUserField(value: any, row: any, userField: 'createdByUser' | 'updatedByUser'): string {
  if (!value) return '-';
  const user = typeof value === 'object' ? value : row[userField];
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user?.firstName || user?.lastName || '-';
}

/**
 * Creates a formatter function for createdByUser column
 * @returns Formatter function for createdByUser
 */
export function createdByUserFormatter() {
  return (value: any, row: any) => formatUserField(value, row, 'createdByUser');
}

/**
 * Creates a formatter function for updatedByUser column
 * @returns Formatter function for updatedByUser
 */
export function updatedByUserFormatter() {
  return (value: any, row: any) => formatUserField(value, row, 'updatedByUser');
}
