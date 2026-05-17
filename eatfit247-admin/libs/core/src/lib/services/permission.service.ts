import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Permission Service
 *
 * Checks permissions from the DB-driven RBAC system.
 * Works with `IAuthUser.permissions` dictionary (e.g., { "Member": ["read","create"], ... }).
 * Roles are DB entities — this service does NOT check role codes directly.
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly authService = inject(AuthService);

  /**
   * Check if current user has a specific permission.
   * @param subject - AdminSubjectEnum value (e.g., 'Member', 'Dashboard')
   * @param action - Action to check (default: 'read')
   */
  hasPermission(subject: string, action = 'read'): boolean {
    const permissions = this.getPermissions();
    const actions = permissions[subject];
    return !!actions && actions.includes(action);
  }

  /**
   * Check if current user has read permission on ANY of the given subjects.
   */
  hasAnyPermission(subjects: string[], action = 'read'): boolean {
    return subjects.some((subject) => this.hasPermission(subject, action));
  }

  /**
   * Check if current user has read permission on ALL of the given subjects.
   */
  hasAllPermissions(subjects: string[], action = 'read'): boolean {
    return subjects.every((subject) => this.hasPermission(subject, action));
  }

  /**
   * Get the full permissions dictionary for the current user.
   */
  getPermissions(): Record<string, string[]> {
    const user = this.authService.getCurrentUser();
    return user?.permissions ?? {};
  }

  /**
   * Check if a subject is franchise-scoped (from subjectMeta).
   */
  isFranchiseScoped(subject: string): boolean {
    const user = this.authService.getCurrentUser();
    return user?.subjectMeta?.[subject]?.franchiseScoped ?? false;
  }

  /**
   * Get current user's franchise IDs.
   */
  getFranchiseIds(): number[] {
    const user = this.authService.getCurrentUser();
    return user?.franchiseIds ?? [];
  }

  /**
   * Get current user's role codes (from roles array, not deprecated roleKeys).
   */
  getRoleCodes(): string[] {
    const user = this.authService.getCurrentUser();
    if (user?.roles?.length) {
      return user.roles.map((r) => r.roleCode);
    }
    // Fallback to deprecated roleKeys during migration
    return user?.roleKeys ?? [];
  }

  /**
   * Get all subjects the user has read access to.
   */
  getReadableSubjects(): string[] {
    const permissions = this.getPermissions();
    return Object.entries(permissions)
      .filter(([, actions]) => actions.includes('read'))
      .map(([subject]) => subject);
  }
}
