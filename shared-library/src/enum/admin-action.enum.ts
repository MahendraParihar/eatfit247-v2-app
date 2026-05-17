/**
 * CASL actions — kept minimal and explicit.
 * 'manage' is CASL's wildcard (all actions).
 */
export enum AdminActionEnum {
    /** @deprecated Roles are now DB-driven. Use discrete actions (Read/Create/Update/Delete). Kept for backward compat. */
    Manage = 'manage',
    Read   = 'read',
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
}