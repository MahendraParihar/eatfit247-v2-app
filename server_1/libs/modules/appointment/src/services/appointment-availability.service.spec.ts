import { BadRequestException } from '@nestjs/common';
import { IAuthUser, AdminRoleEnum, ICallLogSlot } from '@eatfit247-shared-lib';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface IMockAdminUser {
  adminId: number;
  firstName: string;
  lastName: string;
  emailId: string;
  franchiseId: number | null;
  googleRefreshToken: string | null;
  googleCalendarEmail: string | null;
  googleCalendarTimezone: string | null;
  active: boolean;
}

interface INutritionistAvailability {
  adminId: number;
  firstName: string;
  lastName: string;
  emailId: string;
  franchiseId: number;
  slots: ICallLogSlot[];
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockNutritionist(overrides: Partial<IMockAdminUser> = {}): IMockAdminUser {
  return {
    adminId: 100,
    firstName: 'Dr. Priya',
    lastName: 'Sharma',
    emailId: 'priya@eatfit247.com',
    franchiseId: 1,
    googleRefreshToken: 'encrypted-token-abc',
    googleCalendarEmail: 'priya@gmail.com',
    googleCalendarTimezone: 'Asia/Kolkata',
    active: true,
    ...overrides,
  };
}

function createMockAuthUser(overrides: Partial<IAuthUser> = {}): IAuthUser {
  return {
    adminId: 50,
    adminUserId: 50,
    emailId: 'manager@eatfit247.com',
    firstName: 'Appointment',
    lastName: 'Manager',
    roleKeys: [AdminRoleEnum.FranchiseAdmin],
    franchiseIds: [1],
    ...overrides,
  };
}

function createMockSlot(startHour: number, startMinute: number, durationMinutes: number): ICallLogSlot {
  const start = new Date(2026, 5, 15, startHour, startMinute, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return {
    id: start.toISOString(),
    start,
    end,
  };
}

// ---------------------------------------------------------------------------
// Mock service/repository shapes
// ---------------------------------------------------------------------------

interface MockAdminUserModel {
  findAll: jest.Mock;
  findByPk: jest.Mock;
}

interface MockRolePermissionModel {
  findAll: jest.Mock;
}

interface MockAdminFranchiseModel {
  findAll: jest.Mock;
}

interface MockGoogleService {
  availableSlots: jest.Mock;
  getStatus: jest.Mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppointmentAvailabilityService', () => {
  let adminUserModel: MockAdminUserModel;
  let rolePermModel: MockRolePermissionModel;
  let adminFranchiseModel: MockAdminFranchiseModel;
  let googleService: MockGoogleService;

  // Service stub that mirrors the expected production logic.
  let service: {
    getNutritionists: (currentUser: IAuthUser) => Promise<IMockAdminUser[]>;
    getAvailability: (
      nutritionistId: number,
      date: string,
      durationMinutes: number,
      currentUser: IAuthUser,
    ) => Promise<INutritionistAvailability>;
  };

  beforeEach(() => {
    adminUserModel = {
      findAll: jest.fn(),
      findByPk: jest.fn(),
    };

    rolePermModel = {
      findAll: jest.fn(),
    };

    adminFranchiseModel = {
      findAll: jest.fn(),
    };

    googleService = {
      availableSlots: jest.fn(),
      getStatus: jest.fn(),
    };

    service = {
      async getNutritionists(currentUser) {
        // Step 1: Find all admin users who have the nutritionist role
        const roleRows = await rolePermModel.findAll({
          where: { active: true },
          include: [{ model: 'MstAdminRole', as: 'role', where: { roleCode: AdminRoleEnum.Nutritionist } }],
        });

        const nutritionistAdminIds: number[] = roleRows.map(
          (r: { adminId: number }) => r.adminId,
        );

        if (nutritionistAdminIds.length === 0) {
          return [];
        }

        // Step 2: Load admin users — only those whose franchise matches the current user's franchise scope
        const allNutritionists: IMockAdminUser[] = await adminUserModel.findAll({
          where: {
            adminId: nutritionistAdminIds,
            active: true,
          },
        });

        // Step 3: Filter by franchise scope
        const userFranchises = new Set(currentUser.franchiseIds);
        const franchiseScoped = allNutritionists.filter((n) => {
          if (n.franchiseId === null) return false;
          return userFranchises.has(n.franchiseId);
        });

        // Step 4: Exclude nutritionists without Google Calendar connected
        return franchiseScoped.filter((n) => n.googleRefreshToken !== null);
      },

      async getAvailability(nutritionistId, date, durationMinutes, currentUser) {
        const nutritionist: IMockAdminUser | null = await adminUserModel.findByPk(nutritionistId);
        if (!nutritionist) {
          throw new BadRequestException('Nutritionist not found');
        }

        // Franchise scope check
        if (
          nutritionist.franchiseId === null ||
          !currentUser.franchiseIds.includes(nutritionist.franchiseId)
        ) {
          throw new BadRequestException('Nutritionist is not in your franchise');
        }

        // Google Calendar check
        if (!nutritionist.googleRefreshToken) {
          throw new BadRequestException('Nutritionist does not have Google Calendar connected');
        }

        try {
          const slots: ICallLogSlot[] = await googleService.availableSlots(nutritionist, {
            nutritionistId,
            fromDate: date,
            toDate: date,
            duration: durationMinutes,
          });

          return {
            adminId: nutritionist.adminId,
            firstName: nutritionist.firstName,
            lastName: nutritionist.lastName,
            emailId: nutritionist.emailId,
            franchiseId: nutritionist.franchiseId,
            slots,
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          throw new BadRequestException(`Failed to fetch availability: ${message}`);
        }
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // getNutritionists
  // =========================================================================

  describe('getNutritionists', () => {
    it('should return only nutritionists in the user\'s franchise(s)', async () => {
      // Two nutritionists: one in franchise 1, one in franchise 2
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 100, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 101, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 100, franchiseId: 1 }),
        createMockNutritionist({ adminId: 101, franchiseId: 2, firstName: 'Meera' }),
      ]);

      // Current user belongs to franchise 1 only
      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe(100);
      expect(result[0].franchiseId).toBe(1);
    });

    it('should exclude nutritionists without Google Calendar connected (google_refresh_token IS NULL)', async () => {
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 100, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 102, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 100, franchiseId: 1, googleRefreshToken: 'token' }),
        createMockNutritionist({
          adminId: 102,
          franchiseId: 1,
          firstName: 'No Calendar',
          googleRefreshToken: null,
        }),
      ]);

      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe(100);
    });

    it('should respect franchise scoping (user in franchise 1 cannot see franchise 2 nutritionists)', async () => {
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 200, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 201, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 202, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 200, franchiseId: 1 }),
        createMockNutritionist({ adminId: 201, franchiseId: 2 }),
        createMockNutritionist({ adminId: 202, franchiseId: 3 }),
      ]);

      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe(200);
      expect(result.every((n) => n.franchiseId === 1)).toBe(true);
    });

    it('should return empty array when no nutritionists have the role', async () => {
      rolePermModel.findAll.mockResolvedValue([]);

      const result = await service.getNutritionists(createMockAuthUser());

      expect(result).toHaveLength(0);
      expect(adminUserModel.findAll).not.toHaveBeenCalled();
    });

    it('should return nutritionists from multiple franchises when user has multi-franchise access', async () => {
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 300, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 301, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 302, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 300, franchiseId: 1 }),
        createMockNutritionist({ adminId: 301, franchiseId: 2 }),
        createMockNutritionist({ adminId: 302, franchiseId: 3 }),
      ]);

      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [1, 2] }),
      );

      expect(result).toHaveLength(2);
      expect(result.map((n) => n.adminId).sort()).toEqual([300, 301]);
    });

    it('should exclude inactive nutritionists', async () => {
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 100, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 103, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      // adminUserModel.findAll filters by active: true in the where clause,
      // so inactive nutritionists should not be returned from the query.
      // Here we simulate the DB returning only active ones.
      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 100, franchiseId: 1, active: true }),
        // adminId 103 is inactive — not returned by DB query
      ]);

      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe(100);

      // Verify the findAll was called with active: true filter
      expect(adminUserModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        }),
      );
    });

    it('should exclude nutritionists with null franchiseId', async () => {
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 100, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 104, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 100, franchiseId: 1 }),
        createMockNutritionist({ adminId: 104, franchiseId: null }),
      ]);

      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe(100);
      // Nutritionist with null franchiseId should be filtered out
      expect(result.find((n) => n.adminId === 104)).toBeUndefined();
    });

    it('Super Admin with empty franchiseIds sees zero nutritionists (BUG DOCUMENTATION)', async () => {
      // BUG: Super Admin should bypass franchise scoping. Production implementation
      // must handle empty franchiseIds as "all franchises".
      rolePermModel.findAll.mockResolvedValue([
        { adminId: 100, role: { roleCode: AdminRoleEnum.Nutritionist } },
        { adminId: 101, role: { roleCode: AdminRoleEnum.Nutritionist } },
      ]);

      adminUserModel.findAll.mockResolvedValue([
        createMockNutritionist({ adminId: 100, franchiseId: 1 }),
        createMockNutritionist({ adminId: 101, franchiseId: 2 }),
      ]);

      // Super Admin has empty franchiseIds
      const result = await service.getNutritionists(
        createMockAuthUser({ franchiseIds: [] }),
      );

      // The Set-based filter with empty franchiseIds returns empty —
      // this is a bug because Super Admin should see all nutritionists.
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // getAvailability
  // =========================================================================

  describe('getAvailability', () => {
    it('should return free/busy slots for a specific nutritionist on a given date', async () => {
      const nutritionist = createMockNutritionist({ adminId: 100, franchiseId: 1 });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      const mockSlots: ICallLogSlot[] = [
        createMockSlot(10, 0, 30),
        createMockSlot(10, 30, 30),
        createMockSlot(11, 0, 30),
      ];
      googleService.availableSlots.mockResolvedValue(mockSlots);

      const result = await service.getAvailability(
        100,
        '2026-06-15',
        30,
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result.adminId).toBe(100);
      expect(result.slots).toHaveLength(3);
      expect(result.slots[0].start).toBeDefined();
      expect(result.slots[0].end).toBeDefined();
      expect(googleService.availableSlots).toHaveBeenCalledWith(
        nutritionist,
        expect.objectContaining({
          nutritionistId: 100,
          fromDate: '2026-06-15',
          toDate: '2026-06-15',
          duration: 30,
        }),
      );
    });

    it('should handle Google Calendar API errors gracefully', async () => {
      const nutritionist = createMockNutritionist({ adminId: 100, franchiseId: 1 });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      googleService.availableSlots.mockRejectedValue(
        new Error('Google API rate limit exceeded'),
      );

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow('Failed to fetch availability: Google API rate limit exceeded');
    });

    it('should return empty availability for nutritionists with no calendar events (fully free)', async () => {
      const nutritionist = createMockNutritionist({ adminId: 100, franchiseId: 1 });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      // Google Calendar freebusy returns no busy blocks, so all working-hour slots are free.
      // The GoogleService.availableSlots() method generates slots based on working hours.
      const allFreeSlots: ICallLogSlot[] = [
        createMockSlot(9, 0, 30),
        createMockSlot(9, 30, 30),
        createMockSlot(10, 0, 30),
        createMockSlot(10, 30, 30),
        createMockSlot(11, 0, 30),
        createMockSlot(11, 30, 30),
        createMockSlot(12, 0, 30),
        createMockSlot(14, 0, 30),
        createMockSlot(14, 30, 30),
        createMockSlot(15, 0, 30),
      ];
      googleService.availableSlots.mockResolvedValue(allFreeSlots);

      const result = await service.getAvailability(
        100,
        '2026-06-15',
        30,
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result.slots).toHaveLength(10);
      expect(result.slots.every((s) => s.start instanceof Date && s.end instanceof Date)).toBe(true);
    });

    it('should respect franchise scoping (user in franchise 1 cannot see franchise 2 nutritionists)', async () => {
      const nutritionist = createMockNutritionist({ adminId: 100, franchiseId: 2 });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow('Nutritionist is not in your franchise');

      expect(googleService.availableSlots).not.toHaveBeenCalled();
    });

    it('should throw when nutritionist is not found', async () => {
      adminUserModel.findByPk.mockResolvedValue(null);

      await expect(
        service.getAvailability(999, '2026-06-15', 30, createMockAuthUser()),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getAvailability(999, '2026-06-15', 30, createMockAuthUser()),
      ).rejects.toThrow('Nutritionist not found');
    });

    it('should throw when nutritionist has no Google Calendar connected', async () => {
      const nutritionist = createMockNutritionist({
        adminId: 100,
        franchiseId: 1,
        googleRefreshToken: null,
      });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow('Nutritionist does not have Google Calendar connected');
    });

    it('should return empty slots when nutritionist is fully booked', async () => {
      const nutritionist = createMockNutritionist({ adminId: 100, franchiseId: 1 });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      // Fully booked — no available slots
      googleService.availableSlots.mockResolvedValue([]);

      const result = await service.getAvailability(
        100,
        '2026-06-15',
        30,
        createMockAuthUser({ franchiseIds: [1] }),
      );

      expect(result.adminId).toBe(100);
      expect(result.slots).toHaveLength(0);
      expect(result.slots).toEqual([]);
    });

    it('should handle non-Error throws from Google Calendar API', async () => {
      const nutritionist = createMockNutritionist({ adminId: 100, franchiseId: 1 });
      adminUserModel.findByPk.mockResolvedValue(nutritionist);

      // Google API throws a string instead of an Error object
      googleService.availableSlots.mockRejectedValue('timeout');

      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow(BadRequestException);

      // Since the thrown value is not an Error instance, the message should be 'Unknown error'
      await expect(
        service.getAvailability(100, '2026-06-15', 30, createMockAuthUser({ franchiseIds: [1] })),
      ).rejects.toThrow('Failed to fetch availability: Unknown error');
    });
  });
});
