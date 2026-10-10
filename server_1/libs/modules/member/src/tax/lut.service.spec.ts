import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LutService, MstFranchiseLut } from '@server_1/modules/tax-engine';
import { IAuthUser, IManageFranchiseLut } from '@eatfit247-shared-lib';

/** Roadmap 4.6 group 3: LUT register rules (validation A13). */
describe('LutService', () => {
  let findOne: jest.Mock;
  let create: jest.Mock;
  let service: LutService;
  const superAdmin = { adminId: 1, franchiseIds: [] } as unknown as IAuthUser;
  const dubaiOwner = { adminId: 9, franchiseIds: [2] } as unknown as IAuthUser;
  const lut: IManageFranchiseLut = {
    arn: 'AD270326000123X',
    financialYear: '2026-27',
    validFrom: '2026-04-01',
    validTo: '2027-03-31',
  };

  beforeEach(() => {
    findOne = jest.fn().mockResolvedValue(null);
    create = jest.fn().mockImplementation(async (row: Record<string, unknown>) => ({ franchiseLutId: 11, ...row }));
    service = new LutService({ findOne, create, findAll: jest.fn() } as unknown as typeof MstFranchiseLut);
  });

  it('creates an LUT for the financial year it covers', async () => {
    const created = await service.create(1, lut, superAdmin, '127.0.0.1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ franchiseId: 1, arn: 'AD270326000123X', active: true, createdBy: 1 }));
    expect(created.franchiseLutId).toBe(11);
  });

  it('rejects dates outside the stated FY, an inverted period, and a non-consecutive FY', async () => {
    await expect(service.create(1, { ...lut, validTo: '2027-04-01' }, superAdmin, 'ip')).rejects.toThrow('inside FY 2026-27');
    await expect(service.create(1, { ...lut, validFrom: '2026-05-01', validTo: '2026-04-30' }, superAdmin, 'ip')).rejects.toThrow(
      '"Valid from" must be on or before',
    );
    await expect(service.create(1, { ...lut, financialYear: '2026-28' }, superAdmin, 'ip')).rejects.toThrow('consecutive');
  });

  it('rejects a period overlapping another active LUT of the franchise', async () => {
    findOne.mockResolvedValueOnce({ arn: 'AD270326000999Z', validFrom: '2026-04-01', validTo: '2027-03-31' });
    await expect(service.create(1, lut, superAdmin, 'ip')).rejects.toThrow('overlap active LUT AD270326000999Z');
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate ARN for the franchise', async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ franchiseLutId: 3, arn: lut.arn });
    await expect(service.create(1, lut, superAdmin, 'ip')).rejects.toThrow(BadRequestException);
  });

  it("refuses a franchise-scoped admin outside their franchises", async () => {
    await expect(service.list(1, dubaiOwner)).rejects.toThrow(ForbiddenException);
    await expect(service.create(1, lut, dubaiOwner, 'ip')).rejects.toThrow(ForbiddenException);
  });

  it.each([
    [{ active: false, validFrom: '2026-04-01', validTo: '2027-03-31' }, '2026-10-12', 'INACTIVE'],
    [{ active: true, validFrom: null, validTo: null }, '2026-10-12', 'INCOMPLETE'],
    [{ active: true, validFrom: '2026-04-01', validTo: '2027-03-31' }, '2026-10-12', 'VALID'],
    [{ active: true, validFrom: '2026-04-01', validTo: '2027-03-31' }, '2027-03-05', 'EXPIRING'],
    [{ active: true, validFrom: '2026-04-01', validTo: '2027-03-31' }, '2027-04-01', 'EXPIRED'],
    [{ active: true, validFrom: '2027-04-01', validTo: '2028-03-31' }, '2027-03-31', 'FUTURE'],
  ])('status of %j on %s is %s', (row, today, status) => {
    expect(LutService.statusOf(row, today)).toBe(status);
  });
});
