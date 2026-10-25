import { Logger } from '@nestjs/common';
import { MemberService } from './member.service';

/** Configurable tax treatment 8.3 (decision 18): `member.created` from admin create and public signup. */
describe('MemberService member.created', () => {
  let emit: jest.Mock;
  let fetchById: jest.Mock;
  let create: jest.Mock;
  let findOne: jest.Mock;
  let service: MemberService;

  const member = { memberId: 7001, firstName: 'QA', lastName: 'Welcome', emailId: 'qa.welcome@eatfit247.test', countryCode: '+91', contactNumber: '9000000001', franchiseId: 1 };
  const manage = { firstName: 'QA', lastName: 'Welcome', emailId: 'qa.welcome@eatfit247.test', countryCode: '+91', contactNumber: '9000000001', franchiseId: 1, countryId: 101, active: true } as Parameters<MemberService['create']>[0];

  beforeEach(() => {
    emit = jest.fn();
    fetchById = jest.fn().mockResolvedValue({ companyName: 'EAT FIT 247', emailId: 'support@eatfit247.test', contactNumber: '+91-9000000000' });
    create = jest.fn().mockResolvedValue(member);
    findOne = jest.fn().mockResolvedValue(null);
    service = Object.create(MemberService.prototype) as MemberService;
    Object.assign(service, {
      memberRepository: { findOne, create },
      franchiseService: { fetchById, getFranchiseListWithCountry: jest.fn().mockResolvedValue([]) },
      eventEmitter: { emit },
      logger: new Logger('test'),
    });
  });

  it('admin create emits member.created with the member and the franchise\'s name and contacts', async () => {
    await service.create(manage, '127.0.0.1', 19);
    expect(emit).toHaveBeenCalledWith('member.created', {
      memberId: 7001,
      memberName: 'QA Welcome',
      emailId: 'qa.welcome@eatfit247.test',
      phoneNumber: '+91 9000000001',
      franchiseName: 'EAT FIT 247',
      supportEmail: 'support@eatfit247.test',
      supportPhone: '+91-9000000000',
    });
  });

  it('public signup emits it for a new member only', async () => {
    await service.createOrUpdate(manage, '127.0.0.1');
    expect(emit).toHaveBeenCalledTimes(1);
    findOne.mockResolvedValue(member);
    await service.createOrUpdate(manage, '127.0.0.1');
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('a franchise that can\'t be read still emits (no franchise contacts); member creation never fails on it', async () => {
    fetchById.mockRejectedValue(new Error('db down'));
    await expect(service.create(manage, '127.0.0.1', 19)).resolves.toBeUndefined();
    expect(emit.mock.calls[0][1]).toMatchObject({ memberId: 7001, franchiseName: '', supportEmail: null });
    emit.mockImplementation(() => {
      throw new Error('listener blew up');
    });
    await expect(service.create(manage, '127.0.0.1', 19)).resolves.toBeUndefined();
  });
});
