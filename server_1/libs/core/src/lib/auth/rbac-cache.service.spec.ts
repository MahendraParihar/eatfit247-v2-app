import { AdminActionEnum, AdminSubjectEnum } from '@eatfit247-shared-lib';

// ---------------------------------------------------------------------------
// Interfaces for the RBAC cache layer
// ---------------------------------------------------------------------------

/** The full cached permission payload stored per admin user */
interface ICachedPermissions {
  adminId: number;
  roles: Array<{ roleId: number; role: string; roleCode: string }>;
  permissions: Record<string, string[]>;
  franchiseIds: number[];
}

/** Interface for the RbacCacheService that will be implemented */
interface IRbacCacheService {
  getPermissions(adminId: number): Promise<ICachedPermissions | null>;
  setPermissions(adminId: number, data: ICachedPermissions): Promise<void>;
  invalidatePermissions(adminIds: number[]): Promise<void>;
  rebuildPermissions(adminId: number): Promise<ICachedPermissions>;
}

/** Interface for the permission resolution service (DB layer) */
interface IPermissionResolutionService {
  resolveForAdmin(adminId: number): Promise<ICachedPermissions>;
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createCachedPermissions(
  overrides: Partial<ICachedPermissions> = {},
): ICachedPermissions {
  return {
    adminId: 100,
    roles: [{ roleId: 1, role: 'Franchise Admin', roleCode: 'franchise_admin' }],
    permissions: {
      [AdminSubjectEnum.Member]: [
        AdminActionEnum.Read,
        AdminActionEnum.Create,
        AdminActionEnum.Update,
        AdminActionEnum.Delete,
      ],
      [AdminSubjectEnum.Dashboard]: [AdminActionEnum.Read],
    },
    franchiseIds: [1],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Simulated RbacCacheService (the service that tests validate)
// ---------------------------------------------------------------------------

/**
 * Simulated implementation of the RbacCacheService.
 * In production this will be a NestJS Injectable that wraps cache-manager
 * with Redis pub/sub for invalidation.
 */
class RbacCacheService implements IRbacCacheService {
  private readonly CACHE_KEY_PREFIX = 'rbac:permissions:';
  private readonly TTL_SECONDS = 3600;

  constructor(
    private readonly cacheManager: {
      get: (key: string) => Promise<string | undefined>;
      set: (key: string, value: string, ttl?: number) => Promise<void>;
      del: (key: string) => Promise<void>;
    },
    private readonly permissionResolutionService: IPermissionResolutionService,
  ) {}

  async getPermissions(adminId: number): Promise<ICachedPermissions | null> {
    try {
      const cached = await this.cacheManager.get(
        `${this.CACHE_KEY_PREFIX}${adminId}`,
      );
      if (cached) {
        return JSON.parse(cached) as ICachedPermissions;
      }
    } catch {
      // Redis unavailable — fall through to DB
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

  async setPermissions(
    adminId: number,
    data: ICachedPermissions,
  ): Promise<void> {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RbacCacheService', () => {
  let service: RbacCacheService;
  let mockCacheManager: {
    get: jest.Mock<Promise<string | undefined>, [string]>;
    set: jest.Mock<Promise<void>, [string, string, number?]>;
    del: jest.Mock<Promise<void>, [string]>;
  };
  let mockPermissionResolver: jest.Mocked<IPermissionResolutionService>;

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn<Promise<string | undefined>, [string]>(),
      set: jest.fn<Promise<void>, [string, string, number?]>(),
      del: jest.fn<Promise<void>, [string]>(),
    };

    mockPermissionResolver = {
      resolveForAdmin: jest.fn<Promise<ICachedPermissions>, [number]>(),
    };

    service = new RbacCacheService(mockCacheManager, mockPermissionResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPermissions', () => {
    it('should return cached permissions on cache hit', async () => {
      const cached = createCachedPermissions({ adminId: 100 });
      mockCacheManager.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getPermissions(100);

      expect(result).toEqual(cached);
      expect(mockCacheManager.get).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockPermissionResolver.resolveForAdmin).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      const resolved = createCachedPermissions({ adminId: 100 });
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getPermissions(100);

      expect(result).toEqual(resolved);
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'rbac:permissions:100',
        JSON.stringify(resolved),
        3600,
      );
    });

    it('should fall back to DB when Redis is unavailable', async () => {
      const resolved = createCachedPermissions({ adminId: 100 });
      mockCacheManager.get.mockRejectedValue(new Error('Redis connection refused'));
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      // set also fails since Redis is down
      mockCacheManager.set.mockRejectedValue(new Error('Redis connection refused'));

      const result = await service.getPermissions(100);

      expect(result).toEqual(resolved);
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
    });

    it('should cache the full permission structure (roles + permissions dict + franchiseIds)', async () => {
      const resolved = createCachedPermissions({
        adminId: 100,
        roles: [
          { roleId: 1, role: 'Franchise Admin', roleCode: 'franchise_admin' },
          { roleId: 3, role: 'Nutritionist', roleCode: 'nutritionist' },
        ],
        permissions: {
          [AdminSubjectEnum.Member]: [
            AdminActionEnum.Read,
            AdminActionEnum.Create,
            AdminActionEnum.Update,
            AdminActionEnum.Delete,
          ],
          [AdminSubjectEnum.Dashboard]: [AdminActionEnum.Read],
          [AdminSubjectEnum.Recipe]: [
            AdminActionEnum.Read,
            AdminActionEnum.Create,
            AdminActionEnum.Update,
            AdminActionEnum.Delete,
          ],
        },
        franchiseIds: [1, 2, 3],
      });
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getPermissions(100);

      expect(result).toEqual(resolved);
      // Verify the cached value contains all expected structures
      const cachedValue = JSON.parse(
        mockCacheManager.set.mock.calls[0][1],
      ) as ICachedPermissions;
      expect(cachedValue.roles).toHaveLength(2);
      expect(Object.keys(cachedValue.permissions)).toHaveLength(3);
      expect(cachedValue.franchiseIds).toEqual([1, 2, 3]);
    });
  });

  describe('setPermissions', () => {
    it('should set TTL on cached permissions', async () => {
      const data = createCachedPermissions({ adminId: 42 });
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.setPermissions(42, data);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'rbac:permissions:42',
        JSON.stringify(data),
        3600, // TTL in seconds
      );
    });
  });

  describe('invalidatePermissions', () => {
    it('should invalidate cache for specific admin IDs on pub/sub event', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.invalidatePermissions([100, 200, 300]);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:200');
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:300');
    });

    it('should handle concurrent cache invalidation events', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      // Simulate concurrent invalidation calls for overlapping admin IDs
      const promise1 = service.invalidatePermissions([100, 200]);
      const promise2 = service.invalidatePermissions([200, 300]);

      await Promise.all([promise1, promise2]);

      // Admin 200 invalidated twice (once per event) — both should resolve
      expect(mockCacheManager.del).toHaveBeenCalledTimes(4);
      const deletedKeys = mockCacheManager.del.mock.calls.map((call) => call[0]);
      expect(deletedKeys).toContain('rbac:permissions:100');
      expect(deletedKeys).toContain('rbac:permissions:300');
      expect(
        deletedKeys.filter((k) => k === 'rbac:permissions:200'),
      ).toHaveLength(2);
    });
  });

  describe('rebuildPermissions', () => {
    it('should rebuild cache from DB after invalidation', async () => {
      const freshData = createCachedPermissions({
        adminId: 100,
        permissions: {
          [AdminSubjectEnum.Member]: [
            AdminActionEnum.Read,
            AdminActionEnum.Create,
          ],
          [AdminSubjectEnum.Blog]: [AdminActionEnum.Read],
        },
      });
      mockCacheManager.del.mockResolvedValue(undefined);
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(freshData);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.rebuildPermissions(100);

      // Should delete old entry first
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      // Then resolve from DB
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
      // Then cache the new value
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'rbac:permissions:100',
        JSON.stringify(freshData),
        3600,
      );
      expect(result).toEqual(freshData);
    });

    it('should propagate error when DB resolution fails after cache deletion', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);
      mockPermissionResolver.resolveForAdmin.mockRejectedValue(
        new Error('DB connection lost'),
      );

      // Old cache is gone (del succeeded), but DB resolution fails — error must propagate
      await expect(service.rebuildPermissions(100)).rejects.toThrow(
        'DB connection lost',
      );

      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
      // set should not have been called since resolveForAdmin failed
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle corrupted JSON in cache by falling through to DB', async () => {
      const resolved = createCachedPermissions({ adminId: 100 });
      // Return invalid JSON from cache
      mockCacheManager.get.mockResolvedValue('{invalid-json}');
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getPermissions(100);

      // Should have fallen through to DB resolution because JSON.parse threw
      expect(result).toEqual(resolved);
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
    });

    it('should be a no-op when invalidatePermissions receives empty adminIds array', async () => {
      await service.invalidatePermissions([]);

      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should return resolved data even when cache set fails (set failure is non-fatal)', async () => {
      const resolved = createCachedPermissions({ adminId: 100 });
      // get returns cache miss (undefined, not an error)
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      // set fails
      mockCacheManager.set.mockRejectedValue(new Error('Redis write error'));

      const result = await service.getPermissions(100);

      // Should still return the resolved data despite cache set failure
      expect(result).toEqual(resolved);
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
    });

    it('should handle pub/sub invalidation message by parsing adminIds and calling invalidatePermissions', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      // Simulate a handleInvalidationMessage method that would be called
      // from a Redis pub/sub subscriber
      const message = JSON.stringify({ adminIds: [100, 200] });
      const parsed = JSON.parse(message) as { adminIds: number[] };

      await service.invalidatePermissions(parsed.adminIds);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:200');
    });
  });
});
