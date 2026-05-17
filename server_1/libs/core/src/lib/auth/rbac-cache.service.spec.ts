import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AdminActionEnum, AdminSubjectEnum } from '@eatfit247-shared-lib';
import { RbacCacheService } from './rbac-cache.service';
import { PermissionResolutionService } from './permission-resolution.service';
import { ICachedPermissions } from './rbac.interfaces';

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
    subjectMeta: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RbacCacheService', () => {
  let service: RbacCacheService;
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
  let mockPermissionResolver: { resolveForAdmin: jest.Mock };

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockPermissionResolver = {
      resolveForAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacCacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: PermissionResolutionService, useValue: mockPermissionResolver },
      ],
    }).compile();

    service = module.get(RbacCacheService);
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
        3600,
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

      const promise1 = service.invalidatePermissions([100, 200]);
      const promise2 = service.invalidatePermissions([200, 300]);

      await Promise.all([promise1, promise2]);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(4);
      const deletedKeys = mockCacheManager.del.mock.calls.map((call: unknown[]) => call[0]);
      expect(deletedKeys).toContain('rbac:permissions:100');
      expect(deletedKeys).toContain('rbac:permissions:300');
      expect(
        deletedKeys.filter((k: string) => k === 'rbac:permissions:200'),
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

      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
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

      await expect(service.rebuildPermissions(100)).rejects.toThrow(
        'DB connection lost',
      );

      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle corrupted JSON in cache by falling through to DB', async () => {
      const resolved = createCachedPermissions({ adminId: 100 });
      mockCacheManager.get.mockResolvedValue('{invalid-json}');
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.getPermissions(100);

      expect(result).toEqual(resolved);
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
    });

    it('should be a no-op when invalidatePermissions receives empty adminIds array', async () => {
      await service.invalidatePermissions([]);

      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should return resolved data even when cache set fails (set failure is non-fatal)', async () => {
      const resolved = createCachedPermissions({ adminId: 100 });
      mockCacheManager.get.mockResolvedValue(undefined);
      mockPermissionResolver.resolveForAdmin.mockResolvedValue(resolved);
      mockCacheManager.set.mockRejectedValue(new Error('Redis write error'));

      const result = await service.getPermissions(100);

      expect(result).toEqual(resolved);
      expect(mockPermissionResolver.resolveForAdmin).toHaveBeenCalledWith(100);
    });

    it('should handle pub/sub invalidation message by parsing adminIds and calling invalidatePermissions', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      const message = JSON.stringify({ adminIds: [100, 200] });
      const parsed = JSON.parse(message) as { adminIds: number[] };

      await service.invalidatePermissions(parsed.adminIds);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:100');
      expect(mockCacheManager.del).toHaveBeenCalledWith('rbac:permissions:200');
    });
  });
});
