import { BadRequestException } from '@nestjs/common';
import { MemberService } from './member.service';

/** Browser-run fix F3: the franchise is resolved by country only for a NEW member. */
describe('MemberService.createOrUpdate franchise resolution', () => {
  const payload = (countryId: number) =>
    ({
      firstName: 'Test',
      lastName: 'User',
      emailId: 'us@example.com',
      countryCode: '+1',
      contactNumber: '5550100',
      countryId,
      active: true,
      hasAnyPlan: false,
    }) as Parameters<MemberService['createOrUpdate']>[0];

  const serviceWith = (members: { findOne: jest.Mock; create?: jest.Mock }, franchises?: { getFranchiseListWithCountry: jest.Mock }): MemberService => {
    const service = Object.create(MemberService.prototype) as MemberService;
    // member.created (group 8) is emitted after a new member is created
    Object.assign(service, { memberRepository: members, franchiseService: franchises, eventEmitter: { emit: jest.fn() }, logger: { error: jest.fn() } });
    return service;
  };

  it('an existing member is matched first: no franchise lookup, even for a country without a franchise', async () => {
    const getFranchiseListWithCountry = jest.fn();
    const service = serviceWith(
      { findOne: jest.fn().mockResolvedValue({ memberId: 4945, franchiseId: 1 }) },
      { getFranchiseListWithCountry },
    );

    await expect(service.createOrUpdate(payload(231), '127.0.0.1')).resolves.toMatchObject({ memberId: 4945, isNew: false });
    expect(getFranchiseListWithCountry).not.toHaveBeenCalled();
  });

  it('a new member from a country without a franchise gets the default franchise', async () => {
    const create = jest.fn().mockResolvedValue({ memberId: 6000 });
    const service = serviceWith(
      { findOne: jest.fn().mockResolvedValue(null), create },
      {
        getFranchiseListWithCountry: jest.fn().mockResolvedValue([
          { id: 2, label: 'HCUAE', countryId: 229, isDefault: false },
          { id: 1, label: 'EFMUM', countryId: 101, isDefault: true },
        ]),
      },
    );

    await expect(service.createOrUpdate(payload(231), '127.0.0.1')).resolves.toMatchObject({ memberId: 6000, isNew: true });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ franchiseId: 1, countryId: 231 }));
  });

  it('a new member from a country without a franchise and no default franchise is refused with the fix named', async () => {
    const create = jest.fn();
    const service = serviceWith(
      { findOne: jest.fn().mockResolvedValue(null), create },
      { getFranchiseListWithCountry: jest.fn().mockResolvedValue([{ id: 1, label: 'EFMUM', countryId: 101, isDefault: false }]) },
    );

    await expect(service.createOrUpdate(payload(231), '127.0.0.1')).rejects.toThrow(BadRequestException);
    await expect(service.createOrUpdate(payload(231), '127.0.0.1')).rejects.toThrow(/no default franchise.*is_default/);
    expect(create).not.toHaveBeenCalled();
  });
});
