import { LEGACY_RULE_SHAPE, SERVICE_DEFAULT_REFERENCE, TaxMasterService } from '@server_1/modules/tax-engine';
import { TransactionType } from '@eatfit247-shared-lib';

/** Spec 2026-10-10-tax-mapping-matrix decision 9: plan-specific SERVICE rules fall back to reference 1; PRODUCT never does. */
describe('TaxMasterService.getApplicableTaxRule reference fallback', () => {
  let rows: Record<string, { id: number }>;
  let findOne: jest.Mock;
  let service: TaxMasterService;
  const lookup = (referenceId: number, transactionType: TransactionType) =>
    service.getApplicableTaxRule({ franchiseId: 1, referenceId, transactionType, countryCode: 'IN', onDate: '2026-10-12' });

  beforeEach(() => {
    rows = { 'SERVICE/1': { id: 10 }, 'SERVICE/42': { id: 42 }, 'PRODUCT/7': { id: 70 } };
    findOne = jest.fn().mockImplementation(async ({ where }: { where: { transactionType: TransactionType; referenceId: number } }) =>
      rows[`${where.transactionType}/${where.referenceId}`] ?? null,
    );
    service = new TaxMasterService({ findOne } as never, {} as never);
  });

  it('uses the plan-specific rule when one exists (one query)', async () => {
    expect(await lookup(42, TransactionType.SERVICE)).toEqual({ id: 42 });
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it('falls back to reference 1 for a plan without its own rule (second query only for SERVICE)', async () => {
    expect(await lookup(43, TransactionType.SERVICE)).toEqual({ id: 10 });
    expect(findOne).toHaveBeenCalledTimes(2);
    expect(findOne.mock.calls[1][0].where).toMatchObject({ referenceId: SERVICE_DEFAULT_REFERENCE, transactionType: TransactionType.SERVICE });
  });

  it('does not query twice when the reference already is 1', async () => {
    delete rows['SERVICE/1'];
    expect(await lookup(1, TransactionType.SERVICE)).toBeNull();
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it('reads only today\'s rule shape, never the seeded treatment rules (plan 1.7, until the resolver in group 6)', async () => {
    await lookup(42, TransactionType.SERVICE);
    expect(findOne.mock.calls[0][0].where).toMatchObject({
      ...LEGACY_RULE_SHAPE,
      customerScope: 'SAME_COUNTRY',
      treatment: 'CHARGE',
      fallbackOnly: false,
      active: true,
    });
  });

  it('never falls back for PRODUCT (a product id is not a plan)', async () => {
    expect(await lookup(8, TransactionType.PRODUCT)).toBeNull();
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(await lookup(7, TransactionType.PRODUCT)).toEqual({ id: 70 });
  });
});
