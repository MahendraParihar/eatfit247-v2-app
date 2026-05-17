import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAbilityCheck,
  IAuthUser,
  REQUIRE_ABILITY,
} from '@eatfit247-shared-lib';
import { AbilitiesGuard } from './abilities.guard';
import { CaslAbilityFactory, AppAbility } from '../auth/casl-ability.factory';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createAuthUser(overrides: Partial<IAuthUser> = {}): IAuthUser {
  return {
    adminId: 100,
    adminUserId: 100,
    emailId: 'test@eatfit247.com',
    firstName: 'Test',
    lastName: 'User',
    countryCode: '+91',
    contactNumber: '9876543210',
    roleKeys: ['franchise_admin'],
    franchiseIds: [1],
    ...overrides,
  };
}

function createMockExecutionContext(
  user: IAuthUser | undefined,
): ExecutionContext {
  const request = { user };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => jest.fn(),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn() as unknown as ReturnType<ExecutionContext['getClass']>,
    getArgs: () => [request],
    getArgByIndex: (index: number) => [request][index],
    switchToRpc: () => ({ getContext: jest.fn(), getData: jest.fn() }),
    switchToWs: () => ({
      getClient: jest.fn(),
      getData: jest.fn(),
      getPattern: jest.fn(),
    }),
    getType: () => 'http' as const,
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbilitiesGuard', () => {
  let guard: AbilitiesGuard;
  let reflector: jest.Mocked<Reflector>;
  let caslAbilityFactory: jest.Mocked<CaslAbilityFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbilitiesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: CaslAbilityFactory,
          useValue: {
            createForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AbilitiesGuard>(AbilitiesGuard);
    reflector = module.get(Reflector);
    caslAbilityFactory = module.get(CaslAbilityFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request when user has required permission', () => {
    const user = createAuthUser();
    const context = createMockExecutionContext(user);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Read,
      subject: AdminSubjectEnum.Member,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(true),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(caslAbilityFactory.createForUser).toHaveBeenCalledWith(user);
    expect(mockAbility.can).toHaveBeenCalledWith(
      AdminActionEnum.Read,
      AdminSubjectEnum.Member,
    );
  });

  it('should throw ForbiddenException when user lacks required permission', () => {
    const user = createAuthUser({ roleKeys: ['account_user'] });
    const context = createMockExecutionContext(user);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Delete,
      subject: AdminSubjectEnum.Member,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(false),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow request when no @RequireAbility decorator is present', () => {
    const user = createAuthUser();
    const context = createMockExecutionContext(user);

    // No decorator => reflector returns undefined
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    // createForUser should NOT be called since there is no ability check
    expect(caslAbilityFactory.createForUser).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when no user on request', () => {
    const context = createMockExecutionContext(undefined);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Read,
      subject: AdminSubjectEnum.Member,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    // createForUser should NOT be called since there is no user
    expect(caslAbilityFactory.createForUser).not.toHaveBeenCalled();
  });

  it('should check against dynamically loaded abilities (not hardcoded)', () => {
    const user = createAuthUser({ roleKeys: ['nutritionist'], franchiseIds: [3, 5] });
    const context = createMockExecutionContext(user);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Create,
      subject: AdminSubjectEnum.Recipe,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(true),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    // Verify the factory was called with the full user object
    // (in DB-driven mode, the factory uses the user's DB permissions, not roleKeys)
    expect(caslAbilityFactory.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: user.adminId,
        roleKeys: ['nutritionist'],
        franchiseIds: [3, 5],
      }),
    );
    expect(mockAbility.can).toHaveBeenCalledWith(
      AdminActionEnum.Create,
      AdminSubjectEnum.Recipe,
    );
  });

  it('should use reflector to read metadata from handler and class', () => {
    const user = createAuthUser();
    const context = createMockExecutionContext(user);

    reflector.getAllAndOverride.mockReturnValue(undefined);

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_ABILITY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('should throw ForbiddenException for update action when user only has read', () => {
    const user = createAuthUser({ roleKeys: ['account_user'] });
    const context = createMockExecutionContext(user);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Update,
      subject: AdminSubjectEnum.Report,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(false),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(mockAbility.can).toHaveBeenCalledWith(
      AdminActionEnum.Update,
      AdminSubjectEnum.Report,
    );
  });

  it('should handle all 4 discrete action types without manage', () => {
    const user = createAuthUser();
    const context = createMockExecutionContext(user);

    const discreteActions = [
      AdminActionEnum.Read,
      AdminActionEnum.Create,
      AdminActionEnum.Update,
      AdminActionEnum.Delete,
    ];

    for (const action of discreteActions) {
      const abilityCheck: IAbilityCheck = {
        action,
        subject: AdminSubjectEnum.Member,
      };

      reflector.getAllAndOverride.mockReturnValue(abilityCheck);

      const mockAbility = {
        can: jest.fn().mockReturnValue(true),
      } as unknown as AppAbility;
      caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockAbility.can).toHaveBeenCalledWith(action, AdminSubjectEnum.Member);
    }
  });

  it('should still call createForUser when user object is partially formed (missing franchiseIds and roleKeys)', () => {
    const partialUser = createAuthUser({
      adminId: 200,
      emailId: 'partial@eatfit247.com',
      franchiseIds: undefined as unknown as number[],
      roleKeys: undefined as unknown as string[],
    });
    const context = createMockExecutionContext(partialUser);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Read,
      subject: AdminSubjectEnum.Dashboard,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(true),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    // Guard does not validate user shape — it passes user as-is to factory
    expect(caslAbilityFactory.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 200 }),
    );
  });

  it('should use handler-level decorator when it overrides class-level', () => {
    const user = createAuthUser();
    const context = createMockExecutionContext(user);

    // getAllAndOverride returns handler-level check (first match wins in Reflector)
    const handlerLevelCheck: IAbilityCheck = {
      action: AdminActionEnum.Delete,
      subject: AdminSubjectEnum.Franchise,
    };
    reflector.getAllAndOverride.mockReturnValue(handlerLevelCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(true),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    // The handler-level check should be the one used for the ability check
    expect(mockAbility.can).toHaveBeenCalledWith(
      AdminActionEnum.Delete,
      AdminSubjectEnum.Franchise,
    );
  });

  it('should use Manage action when decorator specifies Manage', () => {
    const user = createAuthUser({ roleKeys: ['super_admin'], franchiseIds: [] });
    const context = createMockExecutionContext(user);
    const abilityCheck: IAbilityCheck = {
      action: AdminActionEnum.Manage,
      subject: AdminSubjectEnum.Member,
    };

    reflector.getAllAndOverride.mockReturnValue(abilityCheck);

    const mockAbility = {
      can: jest.fn().mockReturnValue(true),
    } as unknown as AppAbility;
    caslAbilityFactory.createForUser.mockReturnValue(mockAbility);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    // Verify the ability check uses Manage as the action (pre-migration compatibility)
    expect(mockAbility.can).toHaveBeenCalledWith(
      AdminActionEnum.Manage,
      AdminSubjectEnum.Member,
    );
  });
});
