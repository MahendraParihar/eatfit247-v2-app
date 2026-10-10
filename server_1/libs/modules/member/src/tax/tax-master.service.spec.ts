import { MstFranchise } from '@server_1/core';
import { MstTaxMaster, TaxMasterService } from '@server_1/modules/tax-engine';
import { TaxCategoryEnum, TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

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
      { findByPk: jest.fn().mockImplementation(async () => franchise) } as unknown as typeof MstFranchise,
    );
  });

  it('accepts a 0% zero-rated VAT rule for a franchise with a TRN', async () => {
    await service.create(rule({}), '127.0.0.1', 1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ taxCategory: TaxCategoryEnum.ZERO_RATED }));
  });

  it('refuses a 0% VAT rule marked standard', async () => {
    await expect(service.create(rule({ taxCategory: TaxCategoryEnum.STANDARD }), 'ip', 1)).rejects.toThrow('zero-rated or exempt');
  });

  it('refuses a 5% VAT rule that is still marked zero-rated', async () => {
    await expect(service.create(rule({ taxPercent: 5 }), 'ip', 1)).rejects.toThrow('standard-rated');
  });

  it('refuses a VAT rule without a TRN and a GST rule without a GSTIN', async () => {
    franchise = { gstNumber: null, vatNumber: '' };
    await expect(service.create(rule({}), 'ip', 1)).rejects.toThrow('TRN');
    await expect(
      service.create(rule({ taxSystem: TaxTypeEnum.GST, taxPercent: 18, taxCategory: TaxCategoryEnum.STANDARD }), 'ip', 1),
    ).rejects.toThrow('GSTIN');
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts a NONE rule for an unregistered franchise', async () => {
    franchise = { gstNumber: null, vatNumber: null };
    await service.create(rule({ taxSystem: TaxTypeEnum.NONE, taxCategory: TaxCategoryEnum.STANDARD }), 'ip', 1);
    expect(create).toHaveBeenCalled();
  });
});
