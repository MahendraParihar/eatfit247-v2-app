/**
 * CASL actions — kept minimal and explicit.
 * 'manage' is CASL's wildcard (all actions).
 */
export enum AdminActionEnum {
    Manage = 'manage',   // all actions — SuperAdmin only
    Read   = 'read',
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
}