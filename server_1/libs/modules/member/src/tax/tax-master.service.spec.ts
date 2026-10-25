import { ForbiddenException } from '@nestjs/common';
import { Op } from 'sequelize';
import { MstTaxMaster, TaxMasterService, TaxRegistrationService } from '@server_1/modules/tax-engine';
import { IAuthUser, TaxCategoryEnum, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

/** A role with grant_all_on_new_subject: every franchise (configurable tax treatment 3b.1) */
const superAdmin = { adminId: 1, franchiseIds: [], allFranchises: true } as unknown as IAuthUser;

/** Roadmap 4.6 group 6: a tax rule must match the franchise's registration (decisions 7, 18). */
describe('TaxMasterService rule consistency', () => {
  let create: jest.Mock;
  let franchise: { gstNumber: string | null; vatNumber: string | null } | null;
  let service: TaxMasterService;
  const rule = (overrides: Record<string, unknown>) =>
    ({
      franchiseId: 2,
      referenceId: 1,
      countryCode: 'AE',
      transactionType: TransactionType.SERVICE,
      taxSystem: TaxTypeEnum.VAT,
      taxCode: 'VAT_0',
      taxName: 'VAT 0',
      taxPercent: 0,
      applyOn: 'SALE',
      isTaxInclusive: false,
      taxCategory: TaxCategoryEnum.ZERO_RATED,
      effectiveFrom: new Date('2026-01-01'),
      ...overrides,
    }) as never;

  beforeEach(() => {
    create = jest.fn();
    franchise = { gstNumber: null, vatNumber: '100000000000003' };
    service = new TaxMasterService(
      { create } as unknown as typeof MstTaxMaster,
      // An active VAT registration exists when the fixture franchise has a TRN (configurable tax treatment, plan 4.2)
      { hasActive: jest.fn().mockImplementation(async () => !!franchise?.vatNumber?.trim()) } as unknown as TaxRegistrationService,
    );
  });

  it('configurable tax plan 1b.6: today\'s form stores reference 1 on a SERVICE rule as ALL, anything else as SPECIFIC', async () => {
    await service.create(rule({}), '127.0.0.1', superAdmin);
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ referenceId: 1, appliesTo: 'ALL' }));
    await service.create(rule({ referenceId: 263 }), '127.0.0.1', superAdmin);
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ referenceId: 263, appliesTo: 'SPECIFIC' }));
    await service.create(rule({ transactionType: TransactionType.PRODUCT, taxSystem: TaxTypeEnum.NONE, taxCategory: TaxCategoryEnum.STANDARD }), '127.0.0.1', superAdmin);
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ referenceId: 1, appliesTo: 'SPECIFIC' }));
  });

  it('accepts a 0% zero-rated VAT rule for a franchise with a TRN', async () => {
    await service.create(rule({}), '127.0.0.1', superAdmin);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ taxCategory: TaxCategoryEnum.ZERO_RATED }));
  });

  it('refuses a 0% VAT rule marked standard', async () => {
    await expect(service.create(rule({ taxCategory: TaxCategoryEnum.STANDARD }), 'ip', superAdmin)).rejects.toThrow('zero-rated or exempt');
  });

  it('refuses a 5% VAT rule that is still marked zero-rated', async () => {
    await expect(service.create(rule({ taxPercent: 5 }), 'ip', superAdmin)).rejects.toThrow('standard-rated');
  });

  it('refuses a VAT rule without a TRN', async () => {
    franchise = { gstNumber: null, vatNumber: '' };
    await expect(service.create(rule({}), 'ip', superAdmin)).rejects.toThrow('TRN');
    expect(create).not.toHaveBeenCalled();
  });

  it('matrix decision 13: accepts a GST rule for a franchise without a GSTIN (priced as unregistered until added)', async () => {
    franchise = { gstNumber: null, vatNumber: null };
    await service.create(
      rule({ franchiseId: 3, countryCode: 'IN', transactionType: TransactionType.PRODUCT, taxSystem: TaxTypeEnum.GST, taxPercent: 12, taxCategory: TaxCategoryEnum.STANDARD }),
      'ip',
      superAdmin,
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ taxSystem: TaxTypeEnum.GST, taxPercent: 12 }));
  });

  it('accepts a NONE rule for an unregistered franchise', async () => {
    franchise = { gstNumber: null, vatNumber: null };
    await service.create(rule({ taxSystem: TaxTypeEnum.NONE, taxCategory: TaxCategoryEnum.STANDARD }), 'ip', superAdmin);
    expect(create).toHaveBeenCalled();
  });
});

/** Configurable tax treatment plan 3.2 (decision 14): Tax Master is scoped to the admin's franchises in the service. */
describe('TaxMasterService franchise scope', () => {
  const efmumAdmin = { adminId: 21, franchiseIds: [1], allFranchises: false } as unknown as IAuthUser;
  // Super admins 2, 4 and 5 are mapped to EFMUM in the data (review finding 1)
  const mappedSuperAdmin = { adminId: 2, franchiseIds: [1], allFranchises: true } as unknown as IAuthUser;
  const unmappedAdmin = { adminId: 30, franchiseIds: [], allFranchises: false } as unknown as IAuthUser;
  const hcuaeRule = { id: 2, franchiseId: 2, active: true, taxSystem: TaxTypeEnum.VAT, taxCategory: TaxCategoryEnum.ZERO_RATED };
  const efmumRule = { id: 1, franchiseId: 1, active: true, taxSystem: TaxTypeEnum.GST, taxCategory: TaxCategoryEnum.STANDARD };
  let findAndCountAll: jest.Mock;
  let update: jest.Mock;
  let create: jest.Mock;
  let service: TaxMasterService;
  const gstRule = (franchiseId: number) =>
    ({
      franchiseId,
      referenceId: 1,
      countryCode: 'IN',
      transactionType: TransactionType.SERVICE,
      taxSystem: TaxTypeEnum.GST,
      taxCode: 'GST_18',
      taxName: 'GST 18',
      taxPercent: 18,
      applyOn: 'SALE',
      isTaxInclusive: false,
      taxCategory: TaxCategoryEnum.STANDARD,
      effectiveFrom: '2026-01-01',
    }) as never;

  beforeEach(() => {
    findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
    update = jest.fn();
    create = jest.fn();
    const findOne = jest.fn().mockImplementation(async ({ where }: { where: { id: number } }) => (where.id === 2 ? hcuaeRule : efmumRule));
    service = new TaxMasterService(
      { create, update, findOne, scope: () => ({ findAndCountAll, findOne }) } as unknown as typeof MstTaxMaster,
      { hasActive: jest.fn().mockResolvedValue(false) } as unknown as TaxRegistrationService,
    );
  });

  it('lists only the admin\'s franchises; a super admin sees all, mapped or not; an unmapped admin sees none', async () => {
    await service.findAll({ page: 0, limit: 15 } as never, efmumAdmin);
    expect(findAndCountAll.mock.calls[0][0].where.franchiseId).toEqual({ [Op.in]: [1] });
    await service.findAll({ page: 0, limit: 15 } as never, superAdmin);
    expect(findAndCountAll.mock.calls[1][0].where.franchiseId).toBeUndefined();
    await service.findAll({ page: 0, limit: 15 } as never, mappedSuperAdmin);
    expect(findAndCountAll.mock.calls[2][0].where.franchiseId).toBeUndefined();
    await service.findAll({ page: 0, limit: 15 } as never, unmappedAdmin);
    expect(findAndCountAll.mock.calls[3][0].where.franchiseId).toEqual({ [Op.in]: [] });
  });

  it('a super admin mapped to EFMUM still reads and edits HCUAE\'s rules; an unmapped admin is refused (fails closed)', async () => {
    await expect(service.fetchById(2, mappedSuperAdmin)).resolves.toMatchObject({ id: 2 });
    await service.changeStatus(2, true, 'ip', mappedSuperAdmin);
    expect(update).toHaveBeenCalledTimes(1);
    await expect(service.fetchById(1, unmappedAdmin)).rejects.toThrow(ForbiddenException);
    await expect(service.create(gstRule(1), 'ip', unmappedAdmin)).rejects.toThrow(ForbiddenException);
    await expect(service.changeStatus(1, false, 'ip', unmappedAdmin)).rejects.toThrow(ForbiddenException);
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('details of another franchise\'s rule → 403', async () => {
    await expect(service.fetchById(2, efmumAdmin)).rejects.toThrow(ForbiddenException);
    await expect(service.fetchById(2, superAdmin)).resolves.toMatchObject({ id: 2 });
  });

  it('create, update and status change on another franchise → 403, nothing written', async () => {
    await expect(service.create(gstRule(2), 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
    await expect(service.update(2, gstRule(2), 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
    await expect(service.changeStatus(2, false, 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('an own rule can\'t be moved to another franchise', async () => {
    await expect(service.update(1, gstRule(2), 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });

  it('the admin\'s own franchise is writable', async () => {
    await service.create(gstRule(1), 'ip', efmumAdmin);
    await service.update(1, gstRule(1), 'ip', efmumAdmin);
    await service.changeStatus(1, false, 'ip', efmumAdmin);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ franchiseId: 1, createdBy: 21 }));
    expect(update).toHaveBeenCalledTimes(2);
  });
});
