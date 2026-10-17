import { IManageFranchise } from '@eatfit247-shared-lib';
import { AppConfigService, MstFranchise } from '@server_1/core';
import { AddressService, CountryService } from '@server_1/platform';
import { FranchiseService } from './franchise.service';

describe('FranchiseService invoice numbering fields (compliant invoice numbering 3.4)', () => {
  let franchiseRepository: { findOne: jest.Mock; create: jest.Mock; update: jest.Mock };
  let addressService: { findByTableIdAndPk: jest.Mock; createOrUpdate: jest.Mock };
  let countryService: { fetchById: jest.Mock };
  let service: FranchiseService;

  const stored = (overrides: Partial<MstFranchise> = {}): MstFranchise =>
    ({ franchiseId: 1, franchiseCode: 'EFMUM', invoicePrefix: 'EFM', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}', ...overrides }) as MstFranchise;

  const payload = (overrides: Partial<IManageFranchise> = {}): IManageFranchise =>
    ({ franchiseCode: 'EFMUM', financialYear: 4, companyName: 'EAT FIT 247', active: true, ...overrides }) as IManageFranchise;

  beforeEach(() => {
    franchiseRepository = {
      // First call: the franchise being updated; second call: the prefix clash lookup
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({ franchiseId: 9 }),
      update: jest.fn().mockResolvedValue([1]),
    };
    addressService = {
      findByTableIdAndPk: jest.fn().mockResolvedValue({ countryId: 101 }),
      createOrUpdate: jest.fn(),
    };
    countryService = { fetchById: jest.fn().mockImplementation(async (id: number) => ({ countryCode: id === 101 ? 'IN' : 'AE' })) };
    service = new FranchiseService(
      franchiseRepository as unknown as typeof MstFranchise,
      {} as AppConfigService,
      addressService as unknown as AddressService,
      countryService as unknown as CountryService,
    );
  });

  it('saves a valid prefix and template, upper-casing the prefix', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await service.update(1, payload({ invoicePrefix: ' efm ', invoiceNumberFormat: '{PREFIX}-{FY}-{TYPE}-{SEQ5}' }), '::1', 1);
    expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({
      invoicePrefix: 'EFM',
      invoiceNumberFormat: '{PREFIX}-{FY}-{TYPE}-{SEQ5}',
    });
  });

  it('rejects a template too long for an Indian franchise with the listed errors, and saves nothing', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await expect(
      service.update(1, payload({ invoicePrefix: 'EFMUM', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ6}' }), '::1', 1),
    ).rejects.toThrow('The longest number, EFMUM/2627/S/999999, has 19 characters; Indian GST invoices allow at most 16 (Rule 46).');
    expect(franchiseRepository.update).not.toHaveBeenCalled();
  });

  it('the same template is allowed for a non-Indian franchise (country from the payload address)', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await service.update(
      1,
      payload({
        invoicePrefix: 'HCUAE',
        invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ6}',
        addressObj: { countryId: 202 } as IManageFranchise['addressObj'],
      }),
      '::1',
      1,
    );
    expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({ invoicePrefix: 'HCUAE' });
  });

  it('rejects a prefix already used by another franchise as prefix or code', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce({ franchiseId: 3, franchiseCode: 'MEMUM' });
    await expect(service.update(1, payload({ invoicePrefix: 'MEM' }), '::1', 1)).rejects.toThrow(
      'Prefix MEM is already used by franchise MEMUM; invoice numbers must be unique across franchises.',
    );
    expect(franchiseRepository.findOne.mock.calls[1][0].where.franchiseId).toBeDefined();
  });

  it('a payload without the numbering keys keeps the stored format (an older admin form)', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored()).mockResolvedValueOnce(null);
    await service.update(1, payload(), '::1', 1);
    const saved = franchiseRepository.update.mock.calls[0][0];
    expect(saved).not.toHaveProperty('invoicePrefix');
    expect(saved).not.toHaveProperty('invoiceNumberFormat');
    expect(saved).not.toHaveProperty('registrationThresholdAmount');
  });

  it('clearing both fields returns the franchise to the legacy format', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored());
    await service.update(1, payload({ invoicePrefix: '', invoiceNumberFormat: null }), '::1', 1);
    expect(franchiseRepository.update.mock.calls[0][0]).toMatchObject({ invoicePrefix: null, invoiceNumberFormat: null });
  });

  it('a template without a prefix is refused', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(stored({ invoicePrefix: null as unknown as string }));
    await expect(service.update(1, payload({ invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}' }), '::1', 1)).rejects.toThrow(
      'Prefix must be 1 to 5 capital letters or digits.',
    );
  });

  it('saves the registration threshold, and validates the format on create', async () => {
    franchiseRepository.findOne.mockResolvedValueOnce(null);
    await service.create(
      payload({
        invoicePrefix: 'NEW',
        invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}',
        registrationThresholdAmount: 4000000,
        addressObj: { countryId: 101 } as IManageFranchise['addressObj'],
      }),
      '::1',
      1,
    );
    expect(franchiseRepository.create.mock.calls[0][0]).toMatchObject({
      invoicePrefix: 'NEW',
      invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}',
      registrationThresholdAmount: 4000000,
    });
    await expect(service.create(payload({ invoicePrefix: 'NEW', invoiceNumberFormat: '{PREFIX} {TYPE}{SEQ5}' }), '::1', 1)).rejects.toThrow(
      'Only / and - may separate the tokens (found space).',
    );
  });
});
