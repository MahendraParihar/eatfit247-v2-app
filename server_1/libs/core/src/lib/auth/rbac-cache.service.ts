import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PermissionResolutionService } from './permission-resolution.service';
import { ICachedPermissions } from './rbac.interfaces';

@Injectable()
export class RbacCacheService {
  private readonly CACHE_KEY_PREFIX = 'rbac:permissions:';
  private readonly TTL_SECONDS = 3600;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly permissionResolutionService: PermissionResolutionService,
  ) {}

  async getPermissions(adminId: number): Promise<ICachedPermissions | null> {
    try {
      const cached = await this.cacheManager.get<string>(
        `${this.CACHE_KEY_PREFIX}${adminId}`,
      );
      if (cached) {
        return JSON.parse(cached) as ICachedPermissions;
      }
    } catch {
      // Redis unavailable or corrupted JSON — fall through to DB
    }

    // Cache miss or Redis down: load from DB
    const resolved = await this.permissionResolutionService.resolveForAdmin(adminId);
    try {
      await this.setPermissions(adminId, resolved);
    } catch {
      // Cache write failure is non-fatal
    }
    return resolved;
  }

  async setPermissions(adminId: number, data: ICachedPermissions): Promise<void> {
    await this.cacheManager.set(
      `${this.CACHE_KEY_PREFIX}${adminId}`,
      JSON.stringify(data),
      this.TTL_SECONDS,
    );
  }

  async invalidatePermissions(adminIds: number[]): Promise<void> {
    await Promise.all(
      adminIds.map((id) =>
        this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`),
      ),
    );
  }

  async rebuildPermissions(adminId: number): Promise<ICachedPermissions> {
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${adminId}`);
    const resolved = await this.permissionResolutionService.resolveForAdmin(adminId);
    await this.setPermissions(adminId, resolved);
    return resolved;
  }
}
